import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { useActionMutation, useActionQuery, useDbSync, writeClientAppState } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import {
  IconArrowUpRight,
  IconCheck,
  IconFileText,
  IconFlame,
  IconLink,
  IconLoader2,
  IconPlus,
  IconRadar,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { TAB_ID } from "@/lib/tab-id";

import { ago, STAGE_META } from "../signals/format";
import type { Brief, Forge, KeyPoint, Source, SourceStatus } from "./types";

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export function ForgeScreen({ narrativeId }: { narrativeId?: string | undefined }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useDbSync({ queryClient, ignoreSource: TAB_ID, realtime: { reason: "agent researches and writes briefs on the same Forge" } });
  useSetPageTitle(
    <span className="sf-display flex items-center gap-2 text-[15px] font-semibold">
      <IconFlame className="size-4 text-[hsl(var(--primary))]" /> Forge
    </span>,
  );

  const { data, isLoading } = useActionQuery("get-forge", narrativeId ? { narrativeId } : {});
  const forge = data as Forge | undefined;
  const sel = forge?.selected ?? null;
  const n = sel?.narrative;

  useEffect(() => {
    void writeClientAppState(
      `selection:${TAB_ID}`,
      {
        screen: "forge",
        narrativeId: n?.id ?? null,
        title: n?.title ?? null,
        sources: sel ? { total: sel.sources.length, approved: sel.sources.filter((s) => s.status === "approved").length } : null,
        hasBrief: !!sel?.brief,
      },
      { requestSource: TAB_ID },
    );
  }, [n?.id, sel?.sources, sel?.brief]);

  const refresh = () => queryClient.invalidateQueries();
  const research = useActionMutation("research-narrative", {
    onSuccess: (r: unknown) => {
      void refresh();
      const res = r as { added: number; failedFeeds: string[] };
      toast(res.added ? `${res.added} sources found. Approve the ones you trust.` : "No new sources this time. Try the agent for a deeper search.");
    },
    onError: (e: unknown) => toast.error(errText(e, "Research failed")),
  });
  const unpick = useActionMutation("update-narrative", { onSuccess: () => void refresh() });

  if (isLoading) return <Shell><p className="sf-mono mt-16 text-sm text-muted-foreground">Heating the forge…</p></Shell>;
  if (!forge?.queue.length || !sel || !n) return <Shell><EmptyForge /></Shell>;

  const approved = sel.sources.filter((s) => s.status === "approved");
  const stage = STAGE_META[n.stage];
  const step = sel.brief ? 3 : approved.length ? 2 : sel.sources.length ? 1 : 0;

  const agentResearch = () =>
    sendToAgentChat({
      message: `Research the narrative "${n.title}" (${n.id}). Run research-narrative, then read every pending source and record a recommendation with review-source (approve or reject, with a one-line note). Add stronger primary sources with add-source if you find them. Don't write the brief yet.`,
      submit: true,
      newTab: true,
      openSidebar: true,
    });
  const agentBrief = () =>
    sendToAgentChat({
      message: `Write the brief for "${n.title}" (${n.id}) with save-brief, using only my approved sources (read them with get-forge). Every key point must cite the approved source ids it relies on.`,
      submit: true,
      newTab: true,
      openSidebar: true,
    });

  return (
    <Shell>
      <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Queue queue={forge.queue} activeId={n.id} />

        <div className="min-w-0">
          <section className="sf-rise" key={n.id}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`sf-mono rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${stage.className}`}>{stage.label}</span>
              <span className="sf-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {sel.niche} · {sel.region} · momentum {n.momentum}
              </span>
              <button
                type="button"
                onClick={() => {
                  unpick.mutate({ id: n.id, status: "new" } as never);
                  navigate("/forge");
                }}
                className="sf-mono ml-auto text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                Unpick
              </button>
            </div>
            <h1 className="sf-display mt-3 text-3xl font-extrabold leading-[1.05] sm:text-5xl">{n.title}</h1>
            {n.thesis && <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/80">{n.thesis}</p>}
            {n.whyNow && (
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                <span className="sf-mono mr-1.5 text-[10px] uppercase tracking-widest text-[hsl(var(--primary))]">Why now</span>
                {n.whyNow}
              </p>
            )}
            <Steps step={step} />
          </section>

          <SourcesPanel
            narrativeId={n.id}
            sources={sel.sources}
            researching={research.isPending}
            onQuick={() => research.mutate({ narrativeId: n.id } as never)}
            onAgent={agentResearch}
            onChanged={refresh}
          />

          <BriefPanel narrativeId={n.id} brief={sel.brief} approved={approved} onAgent={agentBrief} onChanged={refresh} />
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-stage relative min-h-full overflow-x-hidden">
      <div className="sf-grid-lines pointer-events-none absolute inset-x-0 top-0 h-[360px]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-8">{children}</div>
    </div>
  );
}

function EmptyForge() {
  return (
    <div className="sf-rise mx-auto mt-16 max-w-lg text-center">
      <div className="sf-molten mx-auto flex size-14 items-center justify-center rounded-2xl shadow-[0_10px_40px_-12px_#ff5a1a]">
        <IconFlame className="size-7 text-[#1a0e05]" />
      </div>
      <h1 className="sf-display mt-5 text-3xl font-extrabold">Nothing on the anvil</h1>
      <p className="mt-2 text-muted-foreground">Pick a narrative on the Signals board and it lands here for research, source approval and a brief.</p>
      <Link to="/signals" className="sf-molten sf-display mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-[#1a0e05]">
        <IconRadar className="size-5" /> Go to Signals
      </Link>
    </div>
  );
}

function Queue({ queue, activeId }: { queue: Forge["queue"]; activeId: string }) {
  return (
    <aside className="min-w-0">
      <p className="sf-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">On the anvil · {queue.length}</p>
      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
        {queue.map((q) => {
          const active = q.id === activeId;
          return (
            <Link
              key={q.id}
              to={`/forge/${q.id}`}
              className={`sf-card block min-w-[220px] rounded-xl px-3.5 py-3 transition xl:min-w-0 ${active ? "sf-card-picked" : "opacity-80 hover:opacity-100"}`}
            >
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{q.title}</p>
              <div className="sf-mono mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className={q.approved ? "text-[hsl(var(--primary))]" : ""}>
                  {q.approved}/{q.sources} src
                </span>
                <span>·</span>
                <span className={q.hasBrief ? "text-[hsl(var(--primary))]" : ""}>{q.hasBrief ? "brief ✓" : "no brief"}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const STEPS = ["Research", "Approve sources", "Brief", "Drafts"];
function Steps({ step }: { step: number }) {
  return (
    <ol className="mt-6 grid grid-cols-4 gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="min-w-0">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className={`sf-molten h-full transition-[width] duration-700 ${done ? "sf-heat" : ""}`} style={{ width: done ? "100%" : current ? "35%" : "0%" }} />
            </div>
            <p className={`sf-mono mt-1.5 truncate text-[10px] uppercase tracking-wider ${done || current ? "text-foreground" : "text-muted-foreground/60"}`}>
              {String(i + 1).padStart(2, "0")} {label}
              {i === 3 ? " · next" : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function SourcesPanel({
  narrativeId,
  sources: serverSources,
  researching,
  onQuick,
  onAgent,
  onChanged,
}: {
  narrativeId: string;
  sources: Source[];
  researching: boolean;
  onQuick: () => void;
  onAgent: () => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<SourceStatus | "all">("all");
  const [optimistic, setOptimistic] = useState<Record<string, SourceStatus>>({});
  useEffect(() => setOptimistic({}), [serverSources]);
  const sources = useMemo(
    () => serverSources.map((s) => (optimistic[s.id] ? { ...s, status: optimistic[s.id]!, decidedBy: "user" as const } : s)),
    [serverSources, optimistic],
  );
  const [url, setUrl] = useState("");
  const review = useActionMutation("review-source", {
    onSuccess: onChanged,
    onError: (e: unknown) => {
      setOptimistic({});
      toast.error(errText(e, "Couldn't save"));
    },
  });
  const add = useActionMutation("add-source", {
    onSuccess: (r: unknown) => {
      onChanged();
      setUrl("");
      toast((r as { duplicate: boolean }).duplicate ? "Already in your sources." : "Source added and approved.");
    },
    onError: (e: unknown) => toast.error(errText(e, "Couldn't add that link")),
  });
  const counts = useMemo(
    () => ({
      all: sources.length,
      pending: sources.filter((s) => s.status === "pending").length,
      approved: sources.filter((s) => s.status === "approved").length,
      rejected: sources.filter((s) => s.status === "rejected").length,
    }),
    [sources],
  );
  const recommended = sources.filter((s) => s.status === "pending" && s.recommendation === "approve");
  const flagged = sources.filter((s) => s.status === "pending" && s.recommendation === "reject");
  const rank = (s: Source) => ({ approved: 0, pending: 1, rejected: 2 })[s.status] * 3 + (s.recommendation === "approve" ? 0 : s.recommendation ? 2 : 1);
  const shown = sources.filter((s) => filter === "all" || s.status === filter).sort((a, b) => rank(a) - rank(b));
  const decide = (ids: string[], decision: "approve" | "reject" | "pending") => {
    const status: SourceStatus = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "pending";
    setOptimistic((o) => ({ ...o, ...Object.fromEntries(ids.map((id) => [id, status])) }));
    review.mutate({ ids, decision } as never);
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="sf-display text-2xl font-bold">Sources</h2>
          <p className="text-sm text-muted-foreground">Only sources you approve can be cited in the brief.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onQuick}
            disabled={researching}
            className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground/85 transition hover:border-[hsl(var(--primary)/0.6)] disabled:opacity-60"
          >
            {researching ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
            {researching ? "Reading pages…" : sources.length ? "Find more" : "Quick research"}
          </button>
          <button
            type="button"
            onClick={onAgent}
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.16)]"
          >
            <IconSparkles className="size-4" /> Research with agent
          </button>
        </div>
      </div>

      {researching && !sources.length && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card/60 p-5">
          <div className="sf-wave scale-75" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Searching four feeds and reading each page…</p>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`sf-mono rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wider transition ${
                filter === f ? "border-[hsl(var(--primary))] text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} {counts[f]}
            </button>
          ))}
          {(recommended.length > 0 || flagged.length > 0) && <span className="ml-auto" />}
          {flagged.length > 0 && (
            <button
              type="button"
              onClick={() => decide(flagged.map((s) => s.id), "reject")}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <IconX className="size-3.5" /> Reject {flagged.length} it flags
            </button>
          )}
          {recommended.length > 0 && (
            <button
              type="button"
              onClick={() => decide(recommended.map((s) => s.id), "approve")}
              className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary)/0.15)] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.25)]"
            >
              <IconCheck className="size-3.5" /> Approve {recommended.length} the agent recommends
            </button>
          )}
        </div>
      )}

      {!sources.length && !researching && (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No sources yet. Quick research pulls them from free feeds in a few seconds; the agent also vets each one.
        </p>
      )}

      <ul className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
        {shown.map((s, i) => (
          <SourceCard key={s.id} s={s} index={i} onDecide={(d) => decide([s.id], d)} />
        ))}
      </ul>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const u = url.trim();
          if (!/^https?:\/\//i.test(u)) return toast("Paste a full link starting with https://");
          add.mutate({ narrativeId, url: u } as never);
        }}
      >
        <div className="relative flex-1">
          <IconLink className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Add your own source link"
            aria-label="Source link"
            inputMode="url"
            className="h-11 w-full rounded-lg border border-border bg-card/70 pl-9 pr-3 text-sm outline-none transition focus:border-[hsl(var(--primary))]"
          />
        </div>
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold transition hover:border-[hsl(var(--primary)/0.6)] disabled:opacity-60"
        >
          {add.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlus className="size-4" />} Add
        </button>
      </form>
    </section>
  );
}

function SourceCard({ s, index, onDecide }: { s: Source; index: number; onDecide: (d: "approve" | "reject" | "pending") => void }) {
  const tone =
    s.status === "approved" ? "border-[hsl(var(--primary)/0.6)]" : s.status === "rejected" ? "opacity-50" : "";
  return (
    <li className={`sf-card sf-rise flex flex-col rounded-xl p-4 ${tone}`} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="sf-mono flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="truncate font-bold text-foreground/70">{s.publisher}</span>
        {s.publishedAt && <span>· {ago(s.publishedAt)}</span>}
        {s.addedBy === "user" && <span className="text-[hsl(var(--primary))]">· added by you</span>}
      </div>
      <a href={s.url} target="_blank" rel="noreferrer" className="group mt-1.5 flex items-start gap-1.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug group-hover:underline">{s.title}</h3>
        <IconArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
      </a>
      {s.excerpt && <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-foreground/70">{s.excerpt}</p>}
      {s.recommendation && s.status === "pending" && (
        <p className={`mt-3 rounded-md px-2.5 py-1.5 text-xs ${s.recommendation === "approve" ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "bg-muted text-muted-foreground"}`}>
          <IconSparkles className="mr-1 inline size-3" />
          Agent suggests {s.recommendation}
          {s.note ? `: ${s.note}` : ""}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
        <span className="sf-mono mr-auto whitespace-nowrap text-[10px] uppercase tracking-wider text-muted-foreground">
          {s.status === "pending" ? "Needs your call" : `${s.status} by ${s.decidedBy === "user" ? "you" : "agent"}`}
        </span>
        {s.status !== "pending" && (
          <button type="button" onClick={() => onDecide("pending")} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
            Undo
          </button>
        )}
        <button
          type="button"
          aria-label="Reject source"
          onClick={() => onDecide("reject")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition ${s.status === "rejected" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        >
          <IconX className="size-3.5" /> Reject
        </button>
        <button
          type="button"
          aria-label="Approve source"
          onClick={() => onDecide("approve")}
          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            s.status === "approved"
              ? "bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))]"
              : s.status === "rejected"
                ? "border border-border text-muted-foreground hover:text-foreground"
                : "sf-molten text-[#1a0e05] hover:brightness-110"
          }`}
        >
          <IconCheck className="size-3.5" /> {s.status === "approved" ? "Approved" : "Approve"}
        </button>
      </div>
    </li>
  );
}

function BriefPanel({
  narrativeId,
  brief,
  approved,
  onAgent,
  onChanged,
}: {
  narrativeId: string;
  brief: Brief | null;
  approved: Source[];
  onAgent: () => void;
  onChanged: () => void;
}) {
  const save = useActionMutation("save-brief", {
    onSuccess: onChanged,
    onError: (e: unknown) => toast.error(errText(e, "Couldn't save the brief")),
  });
  const patch = (p: Partial<Pick<Brief, "angle" | "audience" | "tone" | "cta" | "keyPoints">>) => save.mutate({ narrativeId, ...p } as never);
  const byId = new Map(approved.map((s) => [s.id, s]));

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="sf-display text-2xl font-bold">Brief</h2>
          <p className="text-sm text-muted-foreground">
            {brief ? `Written by ${brief.editedBy === "user" ? "you" : "the agent"} · ${ago(brief.updatedAt)}. Click any field to edit.` : "The angle, audience and points every draft will follow."}
          </p>
        </div>
        <button
          type="button"
          onClick={onAgent}
          disabled={!approved.length}
          title={approved.length ? "" : "Approve at least one source first"}
          className="sf-molten flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-[#1a0e05] shadow-[0_10px_30px_-14px_#ff5a1a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <IconFileText className="size-4" /> {brief ? "Rewrite with agent" : "Write brief with agent"}
        </button>
      </div>

      {!brief && (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {approved.length
            ? `${approved.length} approved source${approved.length === 1 ? "" : "s"} ready. Ask the agent to write the brief from them.`
            : "Approve at least one source to unlock the brief."}
        </p>
      )}

      {brief && (
        <div className="sf-card sf-rise mt-5 rounded-2xl p-5 sm:p-7">
          {brief.unapprovedCitations.length > 0 && (
            <p className="mb-4 rounded-md bg-[#ff4a1a]/10 px-3 py-2 text-xs text-[#ff8a5c]">
              {brief.unapprovedCitations.length} cited source{brief.unapprovedCitations.length === 1 ? " is" : "s are"} no longer approved. Rewrite or edit the points that use them.
            </p>
          )}
          <Field label="Angle" value={brief.angle} big onSave={(v) => patch({ angle: v })} />
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field label="Audience" value={brief.audience} onSave={(v) => patch({ audience: v })} />
            <Field label="Tone" value={brief.tone} onSave={(v) => patch({ tone: v })} />
            <Field label="Call to action" value={brief.cta} onSave={(v) => patch({ cta: v })} />
          </div>
          <p className="sf-mono mt-7 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Key points</p>
          <ol className="mt-3 space-y-3">
            {brief.keyPoints.map((k, i) => (
              <KeyPointRow
                key={`${i}-${k.point.slice(0, 12)}`}
                k={k}
                index={i}
                byId={byId}
                onSave={(point) => patch({ keyPoints: brief.keyPoints.map((x, j) => (j === i ? { ...x, point } : x)) })}
                onRemove={brief.keyPoints.length > 1 ? () => patch({ keyPoints: brief.keyPoints.filter((_, j) => j !== i) }) : undefined}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, big, onSave }: { label: string; value: string; big?: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <label className="block">
      <span className="sf-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v.trim() !== value && v.trim().length >= (label === "Angle" ? 3 : 0) && onSave(v.trim())}
        placeholder="—"
        className={`mt-1 min-h-9 w-full resize-none rounded-md [field-sizing:content] border border-transparent bg-transparent px-1.5 py-1 outline-none transition hover:border-border focus:border-[hsl(var(--primary))] focus:bg-background/60 ${
          big ? "sf-display text-xl font-bold leading-snug sm:text-2xl" : "text-sm leading-relaxed"
        }`}
      />
    </label>
  );
}

function KeyPointRow({
  k,
  index,
  byId,
  onSave,
  onRemove,
}: {
  k: KeyPoint;
  index: number;
  byId: Map<string, Source>;
  onSave: (p: string) => void;
  onRemove: (() => void) | undefined;
}) {
  const [v, setV] = useState(k.point);
  useEffect(() => setV(k.point), [k.point]);
  return (
    <li className="group flex gap-3">
      <span className="sf-mono mt-1.5 text-xs text-[hsl(var(--primary))]">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <textarea
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v.trim().length >= 3 && v.trim() !== k.point && onSave(v.trim())}
          className="min-h-9 w-full resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[15px] [field-sizing:content] leading-relaxed outline-none transition hover:border-border focus:border-[hsl(var(--primary))] focus:bg-background/60"
        />
        <div className="mt-1 flex flex-wrap gap-1.5 px-1.5">
          {k.sourceIds.map((id) => {
            const s = byId.get(id);
            return s ? (
              <a
                key={id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                title={s.title}
                className="sf-mono rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:border-[hsl(var(--primary)/0.6)] hover:text-foreground"
              >
                {s.publisher}
              </a>
            ) : (
              <span key={id} className="sf-mono rounded border border-[#ff4a1a]/40 px-1.5 py-0.5 text-[10px] text-[#ff8a5c]">
                unapproved source
              </span>
            );
          })}
          {!k.sourceIds.length && <span className="sf-mono text-[10px] text-muted-foreground/70">no citation</span>}
        </div>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove point" className="mt-1 self-start text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 max-sm:opacity-60">
          <IconTrash className="size-4" />
        </button>
      )}
    </li>
  );
}

