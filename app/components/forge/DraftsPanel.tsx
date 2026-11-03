import { askAgent } from "@/lib/ask-agent";
import { useActionMutation } from "@agent-native/core/client/hooks";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconCalendarEvent,
  IconCheck,
  IconCopy,
  IconLoader2,
  IconMail,
  IconSparkles,
  IconVideo,
  IconWand,
} from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { ago } from "../signals/format";
import type { Brief, Draft, Platform } from "./types";

export const PLATFORMS: { id: Platform; label: string; Icon: typeof IconBrandX; limit: number; title?: string; hint: string }[] = [
  { id: "x", label: "X", Icon: IconBrandX, limit: 280, hint: "Hook post or thread. Put --- on its own line between posts." },
  { id: "linkedin", label: "LinkedIn", Icon: IconBrandLinkedin, limit: 3000, hint: "First line earns the click. Short paragraphs." },
  { id: "instagram", label: "Instagram", Icon: IconBrandInstagram, limit: 2200, hint: "Caption with a hook, story, CTA and hashtags." },
  { id: "newsletter", label: "Newsletter", Icon: IconMail, limit: 6000, title: "Subject line", hint: "A short issue with sources linked inline." },
  { id: "video", label: "Short video", Icon: IconVideo, limit: 2500, title: "Video title", hint: "45-60 s script: [HOOK], [BODY], [CTA] beats." },
];
export const SPEC = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<Platform, (typeof PLATFORMS)[number]>;
const REWRITES = ["Punchier", "Shorter", "More personal", "More authoritative", "Stronger hook"];

const len = (s: string) => [...s].length;
const posts = (body: string) => body.split(/\n\s*---\s*\n/).map((p) => p.trim()).filter(Boolean);
function overLimit(d: { platform: Platform; body: string }) {
  const spec = SPEC[d.platform];
  return d.platform === "x" ? posts(d.body).length > 6 || posts(d.body).some((p) => len(p) > spec.limit) : len(d.body) > spec.limit;
}
const errText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export function DraftsPanel({ narrative, brief, drafts, onChanged }: { narrative: { id: string; title: string }; brief: Brief | null; drafts: Draft[]; onChanged: () => void }) {
  const byPlatform = useMemo(() => new Map(drafts.map((d) => [d.platform, d])), [drafts]);
  const [active, setActive] = useState<Platform>(drafts[0]?.platform ?? "x");
  const [picked, setPicked] = useState<Set<Platform>>(() => new Set(PLATFORMS.map((p) => p.id)));
  const draft = byPlatform.get(active);
  const editedCount = [...picked].filter((p) => byPlatform.get(p)?.editedBy === "user").length;
  const approvable = drafts.filter((d) => d.status === "draft" && !overLimit(d));
  const approveAll = useActionMutation("update-draft", { onError: (e: unknown) => toast.error(errText(e, "Couldn't approve")) });
  const approveAllNow = async () => {
    for (const d of approvable) await approveAll.mutateAsync({ id: d.id, status: "approved" } as never).catch(() => undefined);
    onChanged();
    toast(`${approvable.length} drafts approved. Schedule them below or on the Calendar.`);
  };

  const writeAll = () => {
    const list = PLATFORMS.filter((p) => picked.has(p.id)).map((p) => p.label);
    askAgent(`Write ${list.join(", ")} drafts for "${narrative.title}" (${narrative.id}) from its brief with save-drafts. Write each one natively for its platform, follow the brief's tone and CTA, and use only the brief's key points and approved sources.`, { newTab: true });
  };

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="sf-display text-2xl font-bold">Drafts</h2>
          <p className="text-sm text-muted-foreground">
            {brief ? "One draft per platform, written from the brief. Edit in place, ask for a rewrite, approve when it's ready." : "Drafts unlock once the brief exists."}
          </p>
        </div>
        {approvable.length > 1 && (
          <button
            type="button"
            onClick={() => void approveAllNow()}
            disabled={approveAll.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary)/0.15)] px-3.5 py-2 text-sm font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.25)] disabled:opacity-60"
          >
            {approveAll.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />} Approve all {approvable.length}
          </button>
        )}
      </div>

      {brief && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PLATFORMS.map(({ id, label, Icon }) => {
            const on = picked.has(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; })}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-[hsl(var(--primary)/0.7)] bg-[hsl(var(--primary)/0.12)] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={writeAll}
            disabled={!picked.size}
            className="sf-molten ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-[#1a0e05] shadow-[0_10px_30px_-14px_#ff5a1a] transition hover:brightness-110 disabled:opacity-40 max-sm:ml-0 max-sm:w-full max-sm:justify-center"
          >
            <IconSparkles className="size-4" /> {drafts.length ? "Redraft" : "Draft"} {picked.size === PLATFORMS.length ? "all 5" : picked.size} with agent
          </button>
          {editedCount > 0 && <p className="w-full text-xs text-muted-foreground">{editedCount} you edited will be kept. Ask the agent in chat to replace them.</p>}
        </div>
      )}

      {brief && !drafts.length && (
        <p className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No drafts yet. Pick platforms and let the agent draft them from the brief.</p>
      )}

      {drafts.length > 0 && (
        <div className="sf-card sf-rise @container mt-5 overflow-hidden rounded-2xl">
          <div role="tablist" className="flex overflow-x-auto border-b border-border">
            {PLATFORMS.map(({ id, label, Icon }) => {
              const d = byPlatform.get(id);
              const on = id === active;
              return (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setActive(id)}
                  className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"} ${d ? "" : "opacity-50"}`}
                >
                  <Icon className="size-4" /> {label}
                  {d && <span className={`size-1.5 rounded-full ${d.status !== "draft" ? "bg-[#7dd87d]" : overLimit(d) ? "bg-[#ff4a1a]" : "bg-[hsl(var(--primary))]"}`} />}
                  {on && <span className="sf-molten absolute inset-x-2 bottom-0 h-0.5 rounded-full" />}
                </button>
              );
            })}
          </div>
          {draft ? <DraftEditor key={draft.id} draft={draft} narrativeTitle={narrative.title} onChanged={onChanged} /> : <p className="p-8 text-center text-sm text-muted-foreground">No {SPEC[active].label} draft yet. Select it above and draft with the agent.</p>}
        </div>
      )}
    </section>
  );
}

function DraftEditor({ draft, narrativeTitle, onChanged }: { draft: Draft; narrativeTitle: string; onChanged: () => void }) {
  const spec = SPEC[draft.platform];
  const [body, setBody] = useState(draft.body);
  const [title, setTitle] = useState(draft.title);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState(draft.status);
  useEffect(() => setBody(draft.body), [draft.body]);
  useEffect(() => setTitle(draft.title), [draft.title]);
  useEffect(() => setStatus(draft.status), [draft.status]);

  const update = useActionMutation("update-draft", {
    onSuccess: onChanged,
    onError: (e: unknown) => {
      setStatus(draft.status);
      toast.error(errText(e, "Couldn't save the draft"));
    },
  });
  const over = overLimit({ platform: draft.platform, body });
  const thread = draft.platform === "x" ? posts(body) : [];
  const approved = status !== "draft";
  const scheduleIt = useActionMutation("schedule-draft", {
    onSuccess: () => {
      toast("On the calendar. Export it from Calendar any time.");
      onChanged();
    },
    onError: (e: unknown) => toast.error(errText(e, "Couldn't schedule it")),
  });

  const save = () => {
    const patch: Record<string, string> = {};
    if (body.trim() !== draft.body) patch.body = body;
    if (spec.title && title.trim() !== draft.title) patch.title = title;
    if (Object.keys(patch).length) update.mutate({ id: draft.id, ...patch } as never);
  };
  const rewrite = (how: string) =>
    askAgent(`Rewrite my ${spec.label} draft (${draft.id}) for "${narrativeTitle}": ${how}. Use update-draft, keep to the brief's facts and the ${spec.limit}-character limit.`, { newTab: true });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(spec.title && title ? `${title}\n\n${body}` : body);
      toast("Copied. Paste it wherever you post.");
    } catch {
      toast.error("Couldn't reach the clipboard. Select the text and copy it instead.");
    }
  };

  return (
    <div className="grid gap-0 @2xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0 p-5 sm:p-6">
        {spec.title && (
          <label className="mb-3 block">
            <span className="sf-label text-[11.5px] text-muted-foreground">{spec.title}</span>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              className="sf-display mt-1 min-h-9 w-full resize-none rounded-md [field-sizing:content] border border-transparent bg-transparent px-1.5 py-1 text-xl font-bold outline-none transition hover:border-border focus:border-[hsl(var(--primary))] focus:bg-background/60"
            />
          </label>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={save}
          aria-label={`${spec.label} draft`}
          className="min-h-40 w-full resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[15px] leading-relaxed outline-none transition [field-sizing:content] hover:border-border focus:border-[hsl(var(--primary))] focus:bg-background/60"
        />
        <p className="sf-mono mt-2 px-1.5 text-[10px] text-muted-foreground/80">{spec.hint}</p>
      </div>

      <aside className="flex flex-col gap-4 border-t border-border bg-background/30 p-5 @2xl:border-l @2xl:border-t-0">
        <div>
          <p className="sf-label text-[11.5px] text-muted-foreground">Length</p>
          {draft.platform === "x" ? (
            <ul className="mt-2 space-y-1.5">
              {thread.map((p, i) => (
                <Meter key={i} label={thread.length > 1 ? `post ${i + 1}` : "post"} n={len(p)} limit={spec.limit} />
              ))}
              {thread.length > 6 && <li className="text-xs text-[#ff8a5c]">Threads can have at most 6 posts.</li>}
            </ul>
          ) : (
            <div className="mt-2">
              <Meter label="chars" n={len(body)} limit={spec.limit} />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={over || update.isPending}
            title={over ? "Shorten it to fit the platform first" : ""}
            onClick={() => {
              const next = approved ? "draft" : "approved";
              setStatus(next);
              update.mutate({ id: draft.id, status: next, ...(body.trim() !== draft.body ? { body } : {}) } as never);
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${approved ? "bg-[#7dd87d]/15 text-[#9be89b]" : "sf-molten text-[#1a0e05] hover:brightness-110"}`}
          >
            <IconCheck className="size-4" /> {approved ? "Approved" : "Approve"}
          </button>
          <button type="button" onClick={copy} aria-label="Copy draft" className="rounded-lg border border-border px-3 py-2 text-muted-foreground transition hover:text-foreground">
            <IconCopy className="size-4" />
          </button>
        </div>
        {approved && <ScheduleRow draft={draft} pending={scheduleIt.isPending} onSchedule={(iso) => scheduleIt.mutate({ id: draft.id, scheduledFor: iso } as never)} />}
        <p className="sf-label -mt-2 text-[11.5px] text-muted-foreground">
          {draft.editedBy === "user" ? "Edited by you" : "Written by agent"} · {ago(draft.updatedAt)}
        </p>

        <div>
          <p className="sf-label flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <IconWand className="size-3.5" /> Ask for a rewrite
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REWRITES.map((r) => (
              <button key={r} type="button" onClick={() => rewrite(`make it ${r.toLowerCase()}`)} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-[hsl(var(--primary)/0.6)] hover:text-foreground">
                {r}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) rewrite(custom.trim());
              setCustom("");
            }}
          >
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or say how…" className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-[hsl(var(--primary))]" />
            <button type="submit" disabled={!custom.trim()} className="rounded-md border border-border px-2.5 text-xs disabled:opacity-40">Go</button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function nextHourLocal() {
  const d = new Date(Date.now() + 60 * 60_000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ScheduleRow({ draft, pending, onSchedule }: { draft: Draft; pending: boolean; onSchedule: (iso: string) => void }) {
  const [when, setWhen] = useState(nextHourLocal);
  if (draft.scheduledFor) {
    const at = new Date(draft.scheduledFor).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return (
      <Link to="/calendar" className="-mt-1 flex items-center gap-2 rounded-lg border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.06)] px-3 py-2 text-xs transition hover:border-[hsl(var(--primary)/0.7)]">
        <IconCalendarEvent className="size-4 text-[hsl(var(--primary))]" />
        <span>{draft.status === "published" ? `Posted ${at}` : `On calendar · ${at}`}</span>
      </Link>
    );
  }
  return (
    <form
      className="-mt-1 flex gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (when) onSchedule(new Date(when).toISOString());
      }}
    >
      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Post time" className="sf-mono min-w-0 flex-1 rounded-md border border-border bg-background/60 px-2 py-1.5 text-[11px] [color-scheme:dark] outline-none focus:border-[hsl(var(--primary))]" />
      <button type="submit" disabled={pending || !when} className="flex items-center gap-1 rounded-md border border-[hsl(var(--primary)/0.5)] px-2.5 text-xs font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.1)] disabled:opacity-40">
        <IconCalendarEvent className="size-3.5" /> Schedule
      </button>
    </form>
  );
}

function Meter({ label, n, limit }: { label: string; n: number; limit: number }) {
  const pct = Math.min(100, (n / limit) * 100);
  const over = n > limit;
  return (
    <div>
      <div className="sf-mono flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className={over ? "text-[#ff8a5c]" : ""}>{n}/{limit}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full transition-[width] duration-300 ${over ? "bg-[#ff4a1a]" : "sf-molten"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
