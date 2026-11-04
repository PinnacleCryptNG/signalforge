import { FilterTabs } from "@/components/forge/FilterTabs";
import { askAgent } from "@/lib/ask-agent";
import { autopilotPrompt, useAutopilot } from "@/lib/autopilot";
import { useActionMutation, useActionQuery, useDbSync, writeClientAppState } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import {
  IconArrowUpRight,
  IconAutopilot,
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
} from "@/components/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Term } from "@/components/guide/Term";
import { TAB_ID } from "@/lib/tab-id";

import { ago, STAGE_META } from "../signals/format";
import { DraftsPanel } from "./DraftsPanel";
import type { Brief, Forge, KeyPoint, Source, SourceStatus } from "./types";

const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export function ForgeScreen({ narrativeId }: { narrativeId?: string | undefined }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useDbSync({ queryClient, ignoreSource: TAB_ID, realtime: { reason: "agent researches and writes briefs on the same Forge" } });
  useSetPageTitle(
    <span className="sf-display flex items-center gap-2 text-[15px] font-semibold">
      <IconFlame className="size-4 text-[hsl(var(--primary))]" /> Forge
      <span className="hidden font-sans text-[13px] font-normal text-muted-foreground sm:inline">· write your posts</span>
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
        drafts: sel ? sel.drafts.map((d) => ({ id: d.id, platform: d.platform, status: d.status })) : [],
      },
      { requestSource: TAB_ID },
    );
  }, [n?.id, sel?.sources, sel?.brief, sel?.drafts]);

  const refresh = () => queryClient.invalidateQueries();
  const research = useActionMutation("research-narrative", {
    onSuccess: (r: unknown) => {
      void refresh();
      const res = r as { added: number; failedFeeds: string[] };
      toast(res.added ? `${res.added} articles found. Approve the ones you trust.` : "No new articles this time. Try “Let AI check them” for a deeper search.");
    },
    onError: (e: unknown) => toast.error(errText(e, "Couldn't find articles. Try again.")),
  });
  const unpick = useActionMutation("update-narrative", { onSuccess: () => void refresh() });
  const autopilot = useAutopilot();

  if (isLoading) return <Shell><p className="mt-16 text-sm text-muted-foreground">Loading…</p></Shell>;
  if (!forge?.queue.length || !sel || !n) return <Shell><EmptyForge /></Shell>;

  const approved = sel.sources.filter((s) => s.status === "approved");
  const stage = STAGE_META[n.stage];
  const step = sel.drafts.length ? 4 : sel.brief ? 3 : approved.length ? 2 : sel.sources.length ? 1 : 0;

  const agentResearch = () =>
    askAgent(`Research the narrative "${n.title}" (${n.id}). Run research-narrative once, judge every pending source from the excerpts it returns, then record your recommendations in two review-source calls: one with all the ids to approve, one with all the ids to reject, each with a short note. Only search for more sources if fewer than 3 look relevant. Be quick, and don't write the brief yet.`, { newTab: true });
  const agentBrief = () =>
    askAgent(`Write the brief for "${n.title}" (${n.id}) with save-brief, using only my approved sources (read them with get-forge). Every key point must cite the approved source ids it relies on.`, { newTab: true });

  return (
    <Shell>
      <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Queue queue={forge.queue} activeId={n.id} />

        <div className="@container min-w-0">
          <section className="sf-rise" key={n.id}>
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                <span className={`sf-label rounded border px-2 py-0.5 text-[11.5px] ${stage.className}`}>{stage.label}</span>
                <span className="sf-label min-w-0 text-[12px] text-muted-foreground">
                  {sel.niche} · {sel.region} · buzz {n.momentum}/100
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  unpick.mutate({ id: n.id, status: "new" } as never);
                  navigate("/forge");
                }}
                title="Take this story out of the Forge"
                className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              >
                Remove
              </button>
            </div>
            <h1 className="sf-display mt-3 text-3xl font-extrabold leading-[1.05] @2xl:text-5xl">{n.title}</h1>
            {n.thesis && <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/80">{n.thesis}</p>}
            {n.whyNow && (
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                <span className="sf-label mr-1.5 text-[11.5px] text-[hsl(var(--primary))]">Why it matters now</span>
                {n.whyNow}
              </p>
            )}
            <Steps step={step} />
            <AutopilotBar
              on={!!n.autopilot}
              done={sel.drafts.length > 0}
              pending={autopilot.pending}
              onStart={() => autopilot.start(n)}
              onRerun={() => void askAgent(autopilotPrompt(n), { newTab: true })}
              onStop={() => autopilot.stop(n.id)}
            />
          </section>

          <SourcesPanel
            narrativeId={n.id}
            sources={sel.sources}
            autopilot={!!n.autopilot}
            researching={research.isPending}
            onQuick={() => research.mutate({ narrativeId: n.id } as never)}
            onAgent={agentResearch}
            onChanged={refresh}
          />

          <BriefPanel narrativeId={n.id} brief={sel.brief} approved={approved} onAgent={agentBrief} onChanged={refresh} />

          <DraftsPanel narrative={n} brief={sel.brief} drafts={sel.drafts} onChanged={refresh} />
        </div>
      </div>
    </Shell>
  );
}

function AutopilotBar({ on, done, pending, onStart, onRerun, onStop }: { on: boolean; done: boolean; pending: boolean; onStart: () => void; onRerun: () => void; onStop: () => void }) {
  if (!on && done) return null;
  return (
    <div className={`sf-card mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl p-4 ${on ? "border-[hsl(var(--primary)/0.55)]" : ""}`}>
      <div className="sf-molten flex size-10 shrink-0 items-center justify-center rounded-xl text-[#1a0e05]">
        <IconAutopilot className="size-5" />
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-[15px] font-semibold">{on ? (done ? "Your posts are ready" : "Autopilot is writing your posts") : <>Let AI do it all with <Term k="autopilot" /></>}</p>
        <p className="text-[13px] leading-snug text-muted-foreground">
          {on
            ? done
              ? "Scroll down to read them and approve the ones you like. Tap Run again for a fresh set."
              : "The AI is finding facts, planning the posts and writing all 5. This takes about a minute. Watch it work in the AI helper panel."
            : "The AI finds the facts, plans the posts and writes all 5 for you. You just read and approve. Prefer to check each fact yourself? Use the steps below."}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 max-sm:w-full">
        {on ? (
          <>
            <button type="button" onClick={onStop} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground max-sm:flex-1">
              Turn off
            </button>
            <button
              type="button"
              onClick={onRerun}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.16)] max-sm:flex-1"
            >
              <IconAutopilot className="size-4" /> {done ? "Run again" : "Restart"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={pending}
            className="sf-molten flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-[#1a0e05] shadow-[0_10px_30px_-14px_#ff5a1a] transition hover:brightness-110 disabled:opacity-60 max-sm:w-full"
          >
            <IconAutopilot className="size-4" /> Run Autopilot
          </button>
        )}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-stage relative min-h-full overflow-x-clip">
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
      <h1 className="sf-display mt-5 text-3xl font-extrabold">No story picked yet</h1>
      <p className="mt-2 text-muted-foreground">The <Term k="forge" /> is where your posts get written. Pick a trending story on Signals and it lands here.</p>
      <Link to="/signals" className="sf-molten mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-[#1a0e05]">
        <IconRadar className="size-5" /> Find a trending story
      </Link>
    </div>
  );
}

function Queue({ queue, activeId }: { queue: Forge["queue"]; activeId: string }) {
  return (
    <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
      <p className="sf-label text-[12px] text-muted-foreground">Your stories · {queue.length}</p>
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
              <div className="sf-label mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 whitespace-nowrap text-[11px] text-muted-foreground">
                <span className={q.approved ? "text-[hsl(var(--primary))]" : ""}>
                  {q.approved}/{q.sources} sources
                </span>
                <span className={q.hasBrief ? "text-[hsl(var(--primary))]" : ""}>
                  <span className="mr-1.5 text-muted-foreground">·</span>
                  {q.hasBrief ? "plan ✓" : "no plan yet"}
                </span>
                {q.drafts > 0 && (
                  <span className="text-[hsl(var(--primary))]">
                    <span className="mr-1.5 text-muted-foreground">·</span>
                    {q.drafts} posts
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const STEPS = [
  { label: "Find facts", short: "Facts" },
  { label: "Check facts", short: "Check" },
  { label: "Plan", short: "Plan" },
  { label: "Posts", short: "Posts" },
];
function Steps({ step }: { step: number }) {
  return (
    <ol className="@container mt-6 grid grid-cols-4 gap-2">
      {STEPS.map(({ label, short }, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="min-w-0">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className={`sf-molten h-full transition-[width] duration-700 ${done ? "sf-heat" : ""}`} style={{ width: done ? "100%" : current ? "35%" : "0%" }} />
            </div>
            <p className={`sf-label mt-1.5 text-[11px] leading-snug @md:text-[11.5px] ${done || current ? "text-foreground" : "text-muted-foreground/60"}`}>
              <span className={done || current ? "text-[hsl(var(--primary))]" : ""}>{String(i + 1).padStart(2, "0")}</span>
              <span className="block truncate @lg:ml-1.5 @lg:inline">
                <span className="@md:hidden">{short}</span>
                <span className="hidden @md:inline">{label}</span>
              </span>
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
  autopilot,
  researching,
  onQuick,
  onAgent,
  onChanged,
}: {
  narrativeId: string;
  sources: Source[];
  autopilot: boolean;
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
  const [open, setOpen] = useState(!autopilot);
  useEffect(() => setOpen(!autopilot), [autopilot, narrativeId]);
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
          <h2 className="sf-display text-2xl font-bold">Facts &amp; <Term k="sources">sources</Term></h2>
          <p className="text-sm text-muted-foreground">
            {autopilot ? `Autopilot picked ${counts.approved} of ${counts.all} articles to base your posts on.` : "Articles about this story. Approve the ones you trust; only those are used in your posts."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {autopilot && sources.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground/85 transition hover:border-[hsl(var(--primary)/0.6)]"
            >
              {open ? "Hide articles" : `Show ${counts.all} articles`}
            </button>
          )}
          {(open || !sources.length) && (
          <>
          <button
            type="button"
            onClick={onQuick}
            disabled={researching}
            className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground/85 transition hover:border-[hsl(var(--primary)/0.6)] disabled:opacity-60"
          >
            {researching ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
            {researching ? "Reading articles…" : sources.length ? "Find more" : "Find articles"}
          </button>
          <button
            type="button"
            onClick={onAgent}
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--primary)/0.5)] bg-[hsl(var(--primary)/0.08)] px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.16)]"
          >
            <IconSparkles className="size-4" /> Let AI check them
          </button>
          </>
          )}
        </div>
      </div>

      {researching && !sources.length && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card/60 p-5">
          <div className="sf-wave scale-75" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Searching 4 free sites and reading each article…</p>
        </div>
      )}

      {open && sources.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5">
          <FilterTabs
            label="Filter sources by status"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: "all" as const, label: "All", count: counts.all },
              { id: "pending" as const, label: "To check", count: counts.pending },
              { id: "approved" as const, label: "Approved", count: counts.approved, Icon: IconCheck },
              { id: "rejected" as const, label: "Rejected", count: counts.rejected, Icon: IconX },
            ]}
          />
          {(recommended.length > 0 || flagged.length > 0) && <span className="ml-auto" />}
          {flagged.length > 0 && (
            <button
              type="button"
              onClick={() => decide(flagged.map((s) => s.id), "reject")}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <IconX className="size-3.5" /> Reject the {flagged.length} AI flagged
            </button>
          )}
          {recommended.length > 0 && (
            <button
              type="button"
              onClick={() => decide(recommended.map((s) => s.id), "approve")}
              className="flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary)/0.15)] px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.25)]"
            >
              <IconCheck className="size-3.5" /> Approve the {recommended.length} AI picked
            </button>
          )}
        </div>
      )}

      {!sources.length && !researching && (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No articles yet. Tap Find articles and we'll pull some from free news sites in a few seconds.
        </p>
      )}

      {open && (
      <>
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
            placeholder="Have your own article? Paste its link"
            aria-label="Article link"
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
      </>
      )}
    </section>
  );
}

function SourceCard({ s, index, onDecide }: { s: Source; index: number; onDecide: (d: "approve" | "reject" | "pending") => void }) {
  const tone =
    s.status === "approved" ? "border-[hsl(var(--primary)/0.6)]" : s.status === "rejected" ? "opacity-50" : "";
  return (
    <li className={`sf-card sf-rise flex flex-col rounded-xl p-4 ${tone}`} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="sf-label flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <span className="truncate font-bold text-foreground/70">{s.publisher}</span>
        {s.publishedAt && <span className="shrink-0 whitespace-nowrap">· {ago(s.publishedAt)}</span>}
        {s.addedBy === "user" && <span className="shrink-0 whitespace-nowrap text-[hsl(var(--primary))]">· added by you</span>}
      </div>
      <a href={s.url} target="_blank" rel="noreferrer" className="group mt-1.5 flex items-start gap-1.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug group-hover:underline">{s.title}</h3>
        <IconArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
      </a>
      {s.excerpt && <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-foreground/70">{s.excerpt}</p>}
      {s.recommendation && s.status === "pending" && (
        <p className={`mt-3 rounded-md px-2.5 py-1.5 text-xs ${s.recommendation === "approve" ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "bg-muted text-muted-foreground"}`}>
          <IconSparkles className="mr-1 inline size-3" />
          {s.recommendation === "approve" ? "AI says: use it" : "AI says: skip it"}
          {s.note ? `: ${s.note}` : ""}
        </p>
      )}
      <div className="mt-auto pt-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border/60 pt-3">
        <span className="sf-label mr-auto whitespace-nowrap text-[12px] text-muted-foreground first-letter:uppercase">
          {s.status === "pending" ? "Your call" : `${s.status} by ${s.decidedBy === "user" ? "you" : "AI"}`}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
        {s.status !== "pending" && (
          <button type="button" onClick={() => onDecide("pending")} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
            Undo
          </button>
        )}
        <button
          type="button"
          aria-label="Reject source"
          aria-pressed={s.status === "rejected"}
          onClick={() => onDecide("reject")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition ${s.status === "rejected" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        >
          <IconX className="size-3.5" /> Reject
        </button>
        <button
          type="button"
          aria-label="Approve source"
          aria-pressed={s.status === "approved"}
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
      </div>
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
          <h2 className="sf-display text-2xl font-bold">Post <Term k="brief">plan</Term></h2>
          <p className="text-sm text-muted-foreground">
            {brief ? `Written by ${brief.editedBy === "user" ? "you" : "AI"} · ${ago(brief.updatedAt)}. Tap any field to edit it.` : "The main point, audience and key facts every post will follow."}
          </p>
        </div>
        <button
          type="button"
          onClick={onAgent}
          disabled={!approved.length}
          title={approved.length ? "" : "Approve at least one article first"}
          className="sf-molten flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-[#1a0e05] shadow-[0_10px_30px_-14px_#ff5a1a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <IconFileText className="size-4" /> {brief ? "Rewrite with AI" : "Write the plan with AI"}
        </button>
      </div>

      {!brief && (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {approved.length
            ? `${approved.length} approved article${approved.length === 1 ? "" : "s"} ready. Tap “Write the plan with AI”.`
            : "Approve at least one article above to unlock the plan."}
        </p>
      )}

      {brief && (
        <div className="sf-card sf-rise @container mt-5 rounded-2xl p-5 sm:p-7">
          {brief.unapprovedCitations.length > 0 && (
            <p className="mb-4 rounded-md bg-[#ff4a1a]/10 px-3 py-2 text-xs text-[#ff8a5c]">
              {brief.unapprovedCitations.length} article{brief.unapprovedCitations.length === 1 ? " used here is" : "s used here are"} no longer approved. Rewrite or edit the facts that use them.
            </p>
          )}
          <Field label="Main point" value={brief.angle} big onSave={(v) => patch({ angle: v })} />
          <div className="mt-5 grid gap-5 @xl:grid-cols-3">
            <Field label="Who it's for" value={brief.audience} onSave={(v) => patch({ audience: v })} />
            <Field label="Tone of voice" value={brief.tone} onSave={(v) => patch({ tone: v })} />
            <Field label="What readers should do" value={brief.cta} onSave={(v) => patch({ cta: v })} />
          </div>
          <p className="sf-label mt-7 text-[11.5px] text-[hsl(var(--primary))]">Key facts</p>
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
      <span className="sf-label text-[11.5px] text-muted-foreground">{label}</span>
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v.trim() !== value && v.trim().length >= (big ? 3 : 0) && onSave(v.trim())}
        placeholder="—"
        className={`-mx-1.5 mt-1 min-h-9 w-[calc(100%+0.75rem)] resize-none rounded-md [field-sizing:content] border border-transparent bg-transparent px-1.5 py-1 outline-none transition hover:border-border focus:border-[hsl(var(--primary))] focus:bg-background/60 ${
          big ? "sf-display text-lg font-bold leading-snug @lg:text-xl @2xl:text-2xl" : "text-sm leading-relaxed"
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
                not approved
              </span>
            );
          })}
          {!k.sourceIds.length && <span className="sf-mono text-[10px] text-muted-foreground/70">no source</span>}
        </div>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove this fact" className="mt-1 self-start text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 max-sm:opacity-60">
          <IconTrash className="size-4" />
        </button>
      )}
    </li>
  );
}

