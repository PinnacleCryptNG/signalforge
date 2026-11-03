import { FilterTabs } from "@/components/forge/FilterTabs";
import { askAgent } from "@/lib/ask-agent";
import { useActionMutation, useActionQuery, useDbSync, writeClientAppState } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import { IconArrowUpRight, IconCheck, IconFlame, IconPencil, IconRadar, IconSparkles, IconX } from "@/components/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { TAB_ID } from "@/lib/tab-id";

import { ago, type Board, type Feed, FEED_META, type Narrative, REGIONS, type Signal, STAGE_META, SUGGESTED_NICHES } from "./format";

export function SignalsScreen() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useDbSync({ queryClient, ignoreSource: TAB_ID, realtime: { reason: "agent and user shape the same Signals board" } });
  useSetPageTitle(
    <span className="sf-display flex items-center gap-2 text-[15px] font-semibold">
      <IconRadar className="size-4 text-[hsl(var(--primary))]" /> Signals
    </span>,
  );

  const { data, isLoading } = useActionQuery("get-signals-board", {});
  const board = data as Board | undefined;
  const scan = board?.scan ?? null;
  const [niche, setNiche] = useState("");
  const [region, setRegion] = useState<string>("US");
  const [feedFilter, setFeedFilter] = useState<Feed | "all">("all");

  useEffect(() => {
    if (scan) {
      setNiche((n) => n || scan.niche);
      setRegion(scan.region);
    }
  }, [scan?.id]);

  useEffect(() => {
    void writeClientAppState(
      `selection:${TAB_ID}`,
      {
        screen: "signals",
        scanId: scan?.id ?? null,
        niche: scan?.niche ?? null,
        narratives: board?.narratives.map((n) => ({ id: n.id, title: n.title, status: n.status })) ?? [],
      },
      { requestSource: TAB_ID },
    );
  }, [scan?.id, board?.narratives]);

  const refresh = () => queryClient.invalidateQueries();
  const discover = useActionMutation("discover-signals", {
    onSuccess: () => {
      void refresh();
      toast("Scan complete. Ask the agent to sharpen the narratives.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Scan failed"),
  });
  const update = useActionMutation("update-narrative", { onSuccess: () => void refresh() });

  const byId = useMemo(() => new Map((board?.signals ?? []).map((s) => [s.id, s])), [board?.signals]);
  const scanning = discover.isPending;

  const run = (n = niche) => {
    const q = n.trim();
    if (q.length < 2) return toast("Type a niche first, like “AI agents”.");
    setNiche(q);
    discover.mutate({ niche: q, region } as never);
  };

  const sharpen = () =>
    scan &&
    askAgent(`Sharpen the narratives for my "${scan.niche}" scan (${scan.id}). Read the board with get-signals-board, drop off-topic noise, and save 4-6 specific narratives with save-narratives, each backed by real signal ids. If a narrative sharpens one I picked, list the picked id in replaces.`);

  const wire = (board?.signals ?? []).filter((s) => feedFilter === "all" || s.feed === feedFilter);

  return (
    <div className="sf-stage relative min-h-full overflow-x-hidden">
      <div className="sf-grid-lines pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8">
        <section className="sf-rise">
          <p className="sf-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="sf-pulse-dot mr-2 inline-block size-1.5 rounded-full bg-[hsl(var(--primary))] align-middle" />
            Live from 6 public feeds
          </p>
          <h1 className="sf-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-6xl">
            What's <span className="sf-molten-text">rising</span> in
          </h1>
          <form
            className="mt-5 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="your niche — e.g. fintech in Africa"
              aria-label="Niche"
              className="sf-display h-14 min-h-14 w-full rounded-xl sm:flex-1 border border-border bg-card/80 px-5 text-xl font-semibold outline-none transition placeholder:text-muted-foreground/60 focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.15)]"
            />
            <div className="flex gap-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label="Region"
                className="sf-mono h-14 rounded-xl border border-border bg-card/80 px-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={scanning}
                className="sf-molten sf-display flex h-14 flex-1 items-center justify-center gap-2 rounded-xl px-7 text-base font-bold text-[#1a0e05] shadow-[0_10px_40px_-12px_#ff5a1a] transition hover:brightness-110 disabled:opacity-70 sm:flex-none"
              >
                <IconRadar className={`size-5 ${scanning ? "animate-spin" : ""}`} />
                {scanning ? "Scanning…" : scan ? "Rescan" : "Scan"}
              </button>
            </div>
          </form>
          {!scan && !scanning && (
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_NICHES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => run(s)}
                  className="sf-mono rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-[hsl(var(--primary))] hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        {scanning && <Scanning niche={niche} />}

        {!scanning && isLoading && <p className="sf-mono mt-16 text-sm text-muted-foreground">Loading board…</p>}

        {!scanning && !isLoading && !scan && <EmptyState />}

        {!scanning && scan && board && (
          <>
            <FeedStrip stats={scan.feedStats} createdAt={scan.createdAt} />

            <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="sf-display text-2xl font-bold">Narratives</h2>
                <p className="text-sm text-muted-foreground">
                  The stories behind {board.signals.length} signals for “{scan.niche}”. Pick one to forge into a campaign.
                </p>
              </div>
              <button
                type="button"
                onClick={sharpen}
                className="flex items-center gap-2 rounded-lg border border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.16)]"
              >
                <IconSparkles className="size-4" /> Sharpen with agent
              </button>
            </div>

            {board.narratives.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No clear narratives yet. Ask the agent to sharpen, or try a broader niche.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {board.narratives.map((n, i) => (
                  <NarrativeCard
                    key={n.id}
                    n={n}
                    index={i}
                    evidence={n.signalIds.map((id) => byId.get(id)).filter((s): s is Signal => !!s)}
                    onPatch={(patch) => update.mutate({ id: n.id, ...patch } as never)}
                    onForge={() => {
                      if (n.status !== "picked")
                        update.mutate({ id: n.id, status: "picked" } as never, {
                          onSuccess: (res: unknown) => {
                            const picked = (res as { id?: string } | undefined)?.id;
                            if (picked && picked !== n.id) navigate(`/forge/${picked}`, { replace: true });
                          },
                        });
                      navigate(`/forge/${n.id}`);
                    }}
                  />
                ))}
              </div>
            )}

            <section className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="sf-display text-2xl font-bold">The wire</h2>
                  <p className="text-sm text-muted-foreground">Every raw signal, hottest first.</p>
                </div>
                <FilterTabs
                  label="Filter the wire by feed"
                  value={feedFilter}
                  onChange={setFeedFilter}
                  tabs={[
                    { id: "all" as const, label: "All", count: board.signals.length },
                    ...scan.feedStats.filter((f) => f.count > 0).map((f) => ({ id: f.feed, label: FEED_META[f.feed].tag, count: f.count })),
                  ]}
                />
              </div>
              <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/60">
                {wire.slice(0, 60).map((s) => (
                  <SignalRow key={s.id} s={s} max={board.signals[0]?.score ?? 1} />
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Scanning({ niche }: { niche: string }) {
  return (
    <div className="sf-rise mt-16 flex flex-col items-center gap-5 text-center">
      <div className="sf-wave" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${(i % 14) * 0.07}s` }} />
        ))}
      </div>
      <p className="sf-display text-xl font-semibold">Listening for “{niche}”</p>
      <p className="sf-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {Object.values(FEED_META).map((f) => f.tag).join(" · ")}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="sf-rise mt-16 grid gap-4 sm:grid-cols-3">
      {[
        ["01", "Scan", "Six free public feeds, one niche. No accounts, no keys."],
        ["02", "Name the narrative", "The agent groups raw signals into the stories that are rising."],
        ["03", "Forge", "Pick one. Research it, approve sources, draft every platform."],
      ].map(([k, t, d]) => (
        <div key={k} className="sf-card rounded-xl p-5">
          <p className="sf-mono text-xs text-[hsl(var(--primary))]">{k}</p>
          <p className="sf-display mt-2 text-lg font-bold">{t}</p>
          <p className="mt-1 text-sm text-muted-foreground">{d}</p>
        </div>
      ))}
    </div>
  );
}

function FeedStrip({ stats, createdAt }: { stats: Board["scan"] extends infer S ? (S extends { feedStats: infer F } ? F : never) : never; createdAt: string }) {
  return (
    <div className="sf-rise mt-8 flex flex-wrap items-center gap-2">
      {stats.map((f) => (
        <span
          key={f.feed}
          title={f.ok ? `${FEED_META[f.feed].label}: ${f.count} signals` : `${FEED_META[f.feed].label} unavailable: ${f.error ?? "error"}`}
          className={`sf-mono flex items-center gap-2 rounded-md border border-border bg-card/70 px-2.5 py-1.5 text-[11px] uppercase tracking-wider ${f.ok && f.count ? "" : "opacity-45"}`}
        >
          <span className="size-1.5 rounded-full" style={{ background: f.ok ? FEED_META[f.feed].color : "#666" }} />
          {FEED_META[f.feed].tag}
          <span className="text-muted-foreground">{f.ok ? f.count : "off"}</span>
        </span>
      ))}
      <span className="sf-mono ml-auto text-[11px] text-muted-foreground">scanned {ago(createdAt)}</span>
    </div>
  );
}

function NarrativeCard({
  n,
  index,
  evidence,
  onPatch,
  onForge,
}: {
  n: Narrative;
  index: number;
  evidence: Signal[];
  onPatch: (p: Partial<Pick<Narrative, "title" | "thesis" | "status">>) => void;
  onForge: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(n.title);
  useEffect(() => setTitle(n.title), [n.title]);
  const stage = STAGE_META[n.stage];
  const picked = n.status === "picked";
  const feeds = [...new Set(evidence.map((s) => s.feed))];

  return (
    <article className={`sf-card sf-rise flex flex-col rounded-2xl p-5 ${picked ? "sf-card-picked" : ""}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="flex items-center gap-3">
        <span className={`sf-mono rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${stage.className}`} title={stage.hint}>
          {stage.label}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" title={`Momentum ${n.momentum}/100`}>
          <div className="sf-molten sf-heat h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(6, n.momentum)}%` }} />
        </div>
        <span className="sf-mono text-xs tabular-nums text-muted-foreground">{n.momentum}</span>
      </div>

      {editing ? (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim().length >= 3 && title !== n.title) onPatch({ title: title.trim() });
            setEditing(false);
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            className="sf-display w-full rounded-md border border-[hsl(var(--primary))] bg-background px-2 py-1 text-xl font-bold outline-none"
          />
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="group mt-3 text-left" title="Rename">
          <h3 className="sf-display text-xl font-bold leading-snug">
            {n.title}
            <IconPencil className="ml-2 inline size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </h3>
        </button>
      )}
      {n.thesis && <p className="mt-2 text-sm leading-relaxed text-foreground/80">{n.thesis}</p>}
      {n.whyNow && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <span className="sf-mono mr-1.5 text-[10px] uppercase tracking-widest text-[hsl(var(--primary))]">Why now</span>
          {n.whyNow}
        </p>
      )}

      <ul className="mt-4 space-y-1.5">
        {evidence.slice(0, 3).map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2 text-[13px] leading-snug text-foreground/75 hover:text-foreground">
              <span className="sf-mono mt-0.5 shrink-0 text-[9px] font-bold tracking-wider" style={{ color: FEED_META[s.feed].color }}>
                {FEED_META[s.feed].tag}
              </span>
              <span className="line-clamp-1">{s.title}</span>
              <IconArrowUpRight className="mt-0.5 size-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <span className="sf-mono mr-auto text-[11px] text-muted-foreground">
          {evidence.length} signals · {feeds.length} feed{feeds.length === 1 ? "" : "s"}
          {n.editedBy === "user" ? " · edited by you" : ""}
        </span>
        <button
          type="button"
          onClick={() => onPatch({ status: "dismissed" })}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <IconX className="size-3.5" /> Dismiss
        </button>
        <button
          type="button"
          onClick={onForge}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            picked ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]" : "sf-molten text-[#1a0e05] hover:brightness-110"
          }`}
        >
          {picked ? <IconCheck className="size-3.5" /> : <IconFlame className="size-3.5" />}
          {picked ? "Open in Forge" : "Forge this"}
        </button>
      </div>
    </article>
  );
}

function SignalRow({ s, max }: { s: Signal; max: number }) {
  const meta = FEED_META[s.feed];
  return (
    <li className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-accent/50">
      <span className="sf-mono w-10 shrink-0 text-[10px] font-bold tracking-wider" style={{ color: meta.color }}>
        {meta.tag}
      </span>
      <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground/90 group-hover:text-foreground">{s.title}</p>
        <p className="sf-mono truncate text-[11px] text-muted-foreground">
          {[s.publisher, ago(s.publishedAt), s.engagement ? `${s.engagement.toLocaleString()} engagement` : ""].filter(Boolean).join(" · ")}
        </p>
      </a>
      <div className="hidden h-1 w-20 overflow-hidden rounded-full bg-muted sm:block" title={`Score ${s.score}`}>
        <div className="sf-molten h-full" style={{ width: `${Math.max(4, (100 * s.score) / Math.max(1, max))}%` }} />
      </div>
    </li>
  );
}
