import { useActionMutation, useActionQuery, useDbSync, writeClientAppState } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell";
import {
  IconCalendarDown,
  IconCalendarEvent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCopy,
  IconHandFinger,
  IconX,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { TAB_ID } from "@/lib/tab-id";

import { SPEC } from "../forge/DraftsPanel";
import type { Draft } from "../forge/types";

type Item = Draft & { narrativeTitle: string };
type Calendar = { from: string; to: string; scheduled: Item[]; ready: Item[] };

const DAY = 86_400_000;
const SLOT = 60 * 60_000;
const errText = (e: unknown, fallback: string) =>
  e instanceof Error
    ? e.message
        .replace(/^Action [\w-]+ failed:\s*/, "")
        .replace(/ post \(drf_\w+\) is at (\S+Z)\./, (_m, iso: string) => ` post is at ${new Date(iso).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}.`)
    : fallback;

function startOfWeek(d: Date) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

/** Earliest free hour on that day for the platform, keeping 60 min between same-platform posts. */
function freeSlot(day: Date, platform: Draft["platform"], taken: Item[], prefer?: Date) {
  const start = new Date(day);
  start.setHours(prefer ? prefer.getHours() : 9, prefer ? prefer.getMinutes() : 0, 0, 0);
  const earliest = Date.now() + 5 * 60_000;
  const busy = taken.filter((t) => t.platform === platform && t.scheduledFor).map((t) => [t.id, new Date(t.scheduledFor!).getTime()] as const);
  for (let at = start.getTime(); at < addDays(day, 1).getTime(); at += 30 * 60_000) {
    if (at < earliest) continue;
    if (busy.every(([, b]) => Math.abs(b - at) >= SLOT)) return new Date(at);
  }
  return null;
}

export function CalendarScreen() {
  const queryClient = useQueryClient();
  useDbSync({ queryClient, ignoreSource: TAB_ID, realtime: { reason: "agent can schedule approved drafts on the same calendar" } });
  useSetPageTitle(
    <span className="sf-display flex items-center gap-2 text-[15px] font-semibold">
      <IconCalendarEvent className="size-4 text-[hsl(var(--primary))]" /> Calendar
    </span>,
  );
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const range = { from: week.toISOString(), to: addDays(week, 7).toISOString() };
  const { data, isLoading } = useActionQuery("get-calendar", range);
  const cal = data as Calendar | undefined;
  const ics = useActionQuery("export-ics", {}, { enabled: false } as never);

  // Optimistic overlay so moves land instantly; cleared once the server copy catches up.
  const [overlay, setOverlay] = useState<Record<string, Partial<Item>>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => setOverlay({}), [data]);

  const all = useMemo(() => {
    const map = new Map<string, Item>();
    for (const d of [...(cal?.scheduled ?? []), ...(cal?.ready ?? [])]) map.set(d.id, { ...d, ...overlay[d.id] });
    for (const [id, o] of Object.entries(overlay)) if (!map.has(id) && o.platform) map.set(id, o as Item);
    return [...map.values()];
  }, [cal, overlay]);
  const scheduled = all.filter((d) => d.scheduledFor).sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!));
  const ready = all.filter((d) => !d.scheduledFor && d.status === "approved");
  const heldItem = all.find((d) => d.id === held) ?? null;

  useEffect(() => {
    void writeClientAppState(
      `selection:${TAB_ID}`,
      {
        screen: "calendar",
        weekStart: week.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utcOffsetMinutes: -new Date().getTimezoneOffset(),
        scheduled: scheduled.map((d) => ({ id: d.id, platform: d.platform, status: d.status, scheduledFor: d.scheduledFor })),
        ready: ready.map((d) => ({ id: d.id, platform: d.platform, narrative: d.narrativeTitle })),
      },
      { requestSource: TAB_ID },
    );
  }, [week, data]);

  const schedule = useActionMutation("schedule-draft", {
    onSuccess: () => void queryClient.invalidateQueries(),
    onError: (e: unknown, vars: { id: string }) => {
      setOverlay((o) => {
        const { [vars.id]: _drop, ...rest } = o;
        return rest;
      });
      toast.error(errText(e, "Couldn't update the calendar"));
    },
  });
  const apply = (d: Item, patch: { scheduledFor?: string | null; published?: boolean }) => {
    const scheduledFor = patch.scheduledFor !== undefined ? patch.scheduledFor : d.scheduledFor;
    const published = patch.published ?? d.status === "published";
    setOverlay((o) => ({ ...o, [d.id]: { ...d, scheduledFor: scheduledFor ?? (published ? new Date().toISOString() : null), status: published ? "published" : scheduledFor ? "scheduled" : "approved" } }));
    schedule.mutate({ id: d.id, ...patch } as never);
  };
  const place = (d: Item, day: Date) => {
    const prefer = d.scheduledFor ? new Date(d.scheduledFor) : undefined;
    const at = freeSlot(day, d.platform, scheduled.filter((s) => s.id !== d.id), prefer);
    if (!at) return toast.error(`No free ${SPEC[d.platform].label} slot left that day. Try another day.`);
    setHeld(null);
    apply(d, { scheduledFor: at.toISOString() });
    toast(`${SPEC[d.platform].label} post set for ${day.toLocaleDateString([], { weekday: "short" })} ${time(at.toISOString())}`);
  };

  const onDrop = (day: Date) => (e: DragEvent) => {
    e.preventDefault();
    const d = all.find((x) => x.id === e.dataTransfer.getData("text/plain"));
    if (d) place(d, day);
  };
  const copy = async (d: Item) => {
    try {
      await navigator.clipboard.writeText(d.title ? `${d.title}\n\n${d.body}` : d.body);
      toast("Copied. Paste it into " + SPEC[d.platform].label + ".");
    } catch {
      toast.error("Couldn't reach the clipboard.");
    }
  };
  const exportIcs = async () => {
    const res = await ics.refetch();
    const out = res.data as { filename: string; events: number; ics: string } | undefined;
    if (!out) return toast.error(errText(res.error, "Couldn't build the .ics file"));
    if (!out.events) return toast("Nothing scheduled yet. Put a draft on the calendar first.");
    const url = URL.createObjectURL(new Blob([out.ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: out.filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${out.events} post${out.events === 1 ? "" : "s"} to ${out.filename}`);
  };

  const today = new Date();
  const label = `${days[0]!.toLocaleDateString([], { month: "short", day: "numeric" })} – ${days[6]!.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
  const thisWeek = sameDay(week, startOfWeek(today));

  return (
    <div className="@container mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-8">
      <header className="sf-rise flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <p className="sf-mono text-[11px] uppercase tracking-[0.28em] text-[hsl(var(--primary))]">Publishing calendar</p>
          <h1 className="sf-display mt-1 text-3xl font-bold sm:text-4xl">{label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">You post, SignalForge keeps the plan. Approved drafts land here; export to any calendar app.</p>
        </div>
        <div className="flex items-center gap-2 max-sm:w-full">
          <div className="flex items-center rounded-lg border border-border">
            <button type="button" aria-label="Previous week" onClick={() => setWeek((w) => addDays(w, -7))} className="px-2.5 py-2 text-muted-foreground transition hover:text-foreground">
              <IconChevronLeft className="size-4" />
            </button>
            <button type="button" disabled={thisWeek} onClick={() => setWeek(startOfWeek(new Date()))} className="sf-mono px-2 text-[11px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-40">
              Today
            </button>
            <button type="button" aria-label="Next week" onClick={() => setWeek((w) => addDays(w, 7))} className="px-2.5 py-2 text-muted-foreground transition hover:text-foreground">
              <IconChevronRight className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={exportIcs}
            disabled={ics.isFetching}
            className="sf-molten flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-[#1a0e05] shadow-[0_10px_30px_-14px_#ff5a1a] transition hover:brightness-110 disabled:opacity-50 max-sm:flex-1 max-sm:justify-center"
          >
            <IconCalendarDown className="size-4" /> Export .ics
          </button>
        </div>
      </header>

      <section className="sf-card sf-rise mt-6 rounded-2xl p-4 sm:p-5" aria-label="Ready to schedule">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="sf-display text-lg font-bold">Ready to schedule</h2>
          <span className="sf-mono rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{ready.length}</span>
          <p className="ml-auto text-xs text-muted-foreground max-sm:ml-0 max-sm:w-full">
            {heldItem ? (
              <span className="text-[hsl(var(--primary))]">Now tap a day to place it.</span>
            ) : (
              <>
                <span className="max-sm:hidden">Drag onto a day, or tap a draft then a day.</span>
                <span className="sm:hidden">Tap a draft, then tap a day.</span>
              </>
            )}
          </p>
        </div>
        {ready.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : (
              <>
                No approved drafts waiting. Approve drafts in <Link to="/forge" className="text-[hsl(var(--primary))] underline-offset-2 hover:underline">Forge</Link> and they show up here.
              </>
            )}
          </p>
        ) : (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {ready.map((d) => (
              <li key={d.id} className="shrink-0">
                <Chip d={d} held={held === d.id} onTap={() => setHeld(held === d.id ? null : d.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 grid gap-3 @4xl:grid-cols-7">
        {days.map((day, i) => {
          const items = scheduled.filter((d) => sameDay(new Date(d.scheduledFor!), day));
          const past = addDays(day, 1).getTime() <= Date.now();
          const isToday = sameDay(day, today);
          const canDrop = !!heldItem && !past;
          return (
            <section
              key={day.toISOString()}
              onDragOver={(e) => !past && e.preventDefault()}
              onDrop={past ? undefined : onDrop(day)}
              onClick={() => canDrop && place(heldItem!, day)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`sf-rise relative flex min-h-24 flex-col rounded-2xl border p-3 transition @4xl:min-h-[420px] ${isToday ? "border-[hsl(var(--primary)/0.6)] bg-[hsl(var(--primary)/0.05)]" : "border-border bg-card/40"} ${past ? "opacity-55" : ""} ${canDrop ? "cursor-pointer ring-1 ring-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--primary)/0.08)]" : ""}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="sf-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{day.toLocaleDateString([], { weekday: "short" })}</span>
                <span className={`sf-display text-xl font-bold ${isToday ? "sf-molten-text" : ""}`}>{day.getDate()}</span>
                {isToday && <span className="sf-pulse-dot ml-auto size-1.5 rounded-full bg-[hsl(var(--primary))]" />}
              </div>
              <ul className="mt-2 flex flex-1 flex-col gap-2">
                {items.map((d) => (
                  <li key={d.id}>
                    <Event
                      d={d}
                      editing={editing === d.id}
                      onEdit={() => setEditing(editing === d.id ? null : d.id)}
                      onMove={(iso) => {
                        setEditing(null);
                        apply(d, { scheduledFor: iso });
                      }}
                      onPublish={() => apply(d, { published: d.status !== "published" })}
                      onUnschedule={() => apply(d, { scheduledFor: null, published: false })}
                      onCopy={() => copy(d)}
                    />
                  </li>
                ))}
                {!items.length && !past && <li className="sf-mono hidden flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 text-[10px] uppercase tracking-wider text-muted-foreground/60 @4xl:flex">open</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function PlatformBadge({ d }: { d: Item }) {
  const { Icon, label } = SPEC[d.platform];
  return (
    <span className="sf-mono flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5 text-foreground" /> {label}
    </span>
  );
}

function Chip({ d, held, onTap }: { d: Item; held: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
      onClick={onTap}
      aria-pressed={held}
      className={`flex w-60 cursor-grab flex-col gap-1 rounded-xl border p-3 text-left transition active:cursor-grabbing ${held ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] shadow-[0_0_30px_-10px_#ff6a1a]" : "border-border bg-background/50 hover:border-[hsl(var(--primary)/0.5)]"}`}
    >
      <span className="flex items-center justify-between">
        <PlatformBadge d={d} />
        <IconHandFinger className={`size-3.5 ${held ? "text-[hsl(var(--primary))]" : "text-muted-foreground/50"}`} />
      </span>
      <span className="line-clamp-1 text-sm font-semibold">{d.title || d.narrativeTitle}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{d.body}</span>
    </button>
  );
}

function Event(props: { d: Item; editing: boolean; onEdit: () => void; onMove: (iso: string) => void; onPublish: () => void; onUnschedule: () => void; onCopy: () => void }) {
  const { d } = props;
  const published = d.status === "published";
  const [value, setValue] = useState(() => toLocalInput(d.scheduledFor!));
  useEffect(() => setValue(toLocalInput(d.scheduledFor!)), [d.scheduledFor]);
  return (
    <div
      draggable={!published}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
      onClick={(e) => e.stopPropagation()}
      className={`group rounded-xl border p-2.5 transition ${published ? "border-[#7dd87d]/30 bg-[#7dd87d]/[0.06]" : "cursor-grab border-border bg-background/70 hover:border-[hsl(var(--primary)/0.5)]"}`}
    >
      <p className={`sf-mono text-[11px] font-semibold ${published ? "text-[#9be89b]" : "text-[hsl(var(--primary))]"}`}>{published ? `Posted · ${time(d.scheduledFor!)}` : time(d.scheduledFor!)}</p>
      <div className="mt-1">
        <PlatformBadge d={d} />
      </div>
      <p className={`mt-1 line-clamp-2 text-[13px] font-semibold leading-snug ${published ? "text-muted-foreground line-through decoration-[#7dd87d]/60" : ""}`}>{d.title || d.narrativeTitle}</p>
      {props.editing && (
        <form
          className="mt-2 flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (value) props.onMove(new Date(value).toISOString());
          }}
        >
          <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} aria-label="New time" className="sf-mono w-full rounded-md border border-border bg-background px-2 py-1 text-xs [color-scheme:dark]" />
          <button type="submit" className="sf-molten rounded-md py-1 text-xs font-bold text-[#1a0e05]">Move here</button>
        </form>
      )}
      <div className="-mx-1 mt-2 flex flex-wrap items-center">
        <Act label={published ? "Mark not posted" : "Mark published"} onClick={props.onPublish} on={published}>
          <IconCheck className="size-3.5" />
        </Act>
        <Act label="Copy text" onClick={props.onCopy}>
          <IconCopy className="size-3.5" />
        </Act>
        {!published && (
          <Act label="Change time" onClick={props.onEdit} on={props.editing}>
            <IconClock className="size-3.5" />
          </Act>
        )}
        <Act label="Take off calendar" onClick={props.onUnschedule}>
          <IconX className="size-3.5" />
        </Act>
      </div>
    </div>
  );
}

function Act({ label, onClick, on, children }: { label: string; onClick: () => void; on?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-md border p-1.5 transition ${on ? "border-[hsl(var(--primary)/0.5)] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
