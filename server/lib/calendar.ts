import { and, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";

import { getDb } from "../db/index.js";
import { drafts, narratives, type DraftRow, type Platform } from "../db/schema.js";
import { PLATFORM_SPECS } from "./drafts.js";

/** Two posts on the same platform must sit at least this far apart. */
export const SLOT_MINUTES = 60;

export type CalendarItem = DraftRow & { narrativeTitle: string };

async function withTitles(owner: string, rows: DraftRow[]): Promise<CalendarItem[]> {
  if (!rows.length) return [];
  const ns = await getDb().select({ id: narratives.id, title: narratives.title }).from(narratives).where(eq(narratives.ownerEmail, owner));
  const titles = new Map(ns.map((n) => [n.id, n.title]));
  return rows.map((r) => ({ ...r, narrativeTitle: titles.get(r.narrativeId) ?? "" }));
}

export async function getCalendar(owner: string, from: string, to: string) {
  const db = getDb();
  const [scheduled, ready] = await Promise.all([
    db
      .select()
      .from(drafts)
      .where(and(eq(drafts.ownerEmail, owner), isNotNull(drafts.scheduledFor), gte(drafts.scheduledFor, from), lt(drafts.scheduledFor, to))),
    db
      .select()
      .from(drafts)
      .where(and(eq(drafts.ownerEmail, owner), eq(drafts.status, "approved"), isNull(drafts.scheduledFor))),
  ]);
  scheduled.sort((a, b) => a.scheduledFor!.localeCompare(b.scheduledFor!));
  return { from, to, scheduled: await withTitles(owner, scheduled), ready: await withTitles(owner, ready) };
}

/** Returns the draft already holding a slot within SLOT_MINUTES on the same platform, if any. */
export async function slotClash(owner: string, platform: Platform, at: Date, exceptId: string) {
  const span = SLOT_MINUTES * 60_000;
  const rows = await getDb()
    .select()
    .from(drafts)
    .where(
      and(
        eq(drafts.ownerEmail, owner),
        eq(drafts.platform, platform),
        isNotNull(drafts.scheduledFor),
        gte(drafts.scheduledFor, new Date(at.getTime() - span + 1).toISOString()),
        lt(drafts.scheduledFor, new Date(at.getTime() + span).toISOString()),
      ),
    );
  return rows.find((r) => r.id !== exceptId) ?? null;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** RFC 5545 line folding: at most 75 octets per line, continuation lines start with a space. */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(items: CalendarItem[]) {
  const now = stamp(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SignalForge//Content Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:SignalForge"];
  for (const d of items) {
    const label = PLATFORM_SPECS[d.platform].label;
    const head = d.title || d.narrativeTitle;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${d.id}@signalforge`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(new Date(d.scheduledFor!).toISOString())}`,
      "DURATION:PT30M",
      `SUMMARY:${esc(`${d.status === "published" ? "✓ " : ""}Post on ${label}: ${head}`)}`,
      `DESCRIPTION:${esc(`${d.title ? `${d.title}\n\n` : ""}${d.body}\n\nCopy this into ${label} and post it. SignalForge never posts for you.`)}`,
      `CATEGORIES:${esc(label)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`Time to post on ${label}`)}`,
      "TRIGGER:-PT10M",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
