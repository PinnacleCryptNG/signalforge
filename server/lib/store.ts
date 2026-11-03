import { randomUUID } from "node:crypto";

import { fail } from "@agent-native/core/action";
import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "../db/index.js";
import { narratives, scans, signals, type Actor, type NarrativeRow, type SignalRow } from "../db/schema.js";
import { collectSignals } from "./feeds.js";
import { clusterSignals, signalScore } from "./narratives.js";

export const nowIso = () => new Date().toISOString();
export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
export const parseList = (s: string): string[] => {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

/** The browser UI and CLI are the user; chat tools, MCP, A2A and automations are the agent. */
export function actorFromCaller(caller?: string): Actor {
  return caller === "frontend" || caller === "cli" ? "user" : "agent";
}

export async function runScan(owner: string, niche: string, region: string) {
  const { signals: raw, stats } = await collectSignals(niche, region);
  if (raw.length === 0) {
    fail(`No signals found for "${niche}". Try a broader niche (e.g. "fintech" instead of a company name).`, {
      errorCode: "no_signals",
      statusCode: 404,
    });
  }
  const db = getDb();
  const scanId = newId("scan");
  await db.insert(scans).values({ id: scanId, ownerEmail: owner, niche, region, feedStats: JSON.stringify(stats), createdAt: nowIso() });
  const rows = raw.map((r) => ({ ...r, id: newId("sig"), ownerEmail: owner, scanId, score: signalScore(r) }));
  for (let i = 0; i < rows.length; i += 50) await db.insert(signals).values(rows.slice(i, i + 50));
  const clusters = clusterSignals(niche, raw);
  if (clusters.length) {
    await db.insert(narratives).values(
      clusters.map((c) => ({
        id: newId("nar"),
        ownerEmail: owner,
        scanId,
        title: c.title,
        thesis: c.thesis,
        whyNow: c.whyNow,
        keywords: JSON.stringify(c.keywords),
        signalIds: JSON.stringify(c.members.map((i) => rows[i]!.id)),
        momentum: c.momentum,
        stage: c.stage,
        updatedAt: nowIso(),
      })),
    );
  }
  return { scanId, stats, signalCount: rows.length, narrativeCount: clusters.length };
}

export type NarrativeView = Omit<NarrativeRow, "keywords" | "signalIds"> & { keywords: string[]; signalIds: string[] };
const viewNarrative = (n: NarrativeRow): NarrativeView => ({ ...n, keywords: parseList(n.keywords), signalIds: parseList(n.signalIds) });

export async function getBoard(owner: string, scanId?: string) {
  const db = getDb();
  const [scan] = scanId
    ? await db.select().from(scans).where(and(eq(scans.ownerEmail, owner), eq(scans.id, scanId)))
    : await db.select().from(scans).where(eq(scans.ownerEmail, owner)).orderBy(desc(scans.createdAt)).limit(1);
  if (!scan) return { scan: null, narratives: [], signals: [] as SignalRow[] };
  const [nar, sig] = await Promise.all([
    db.select().from(narratives).where(and(eq(narratives.ownerEmail, owner), eq(narratives.scanId, scan.id))),
    db.select().from(signals).where(and(eq(signals.ownerEmail, owner), eq(signals.scanId, scan.id))),
  ]);
  return {
    scan: { ...scan, feedStats: JSON.parse(scan.feedStats || "[]") },
    narratives: nar
      .filter((n) => n.status !== "dismissed")
      .map(viewNarrative)
      .sort((a, b) => Number(b.status === "picked") - Number(a.status === "picked") || b.momentum - a.momentum),
    signals: sig.sort((a, b) => b.score - a.score),
  };
}

export async function getNarrative(owner: string, id: string) {
  const [row] = await getDb().select().from(narratives).where(and(eq(narratives.ownerEmail, owner), eq(narratives.id, id)));
  if (!row) fail(`Narrative ${id} not found.`, { errorCode: "not_found", statusCode: 404 });
  return viewNarrative(row!);
}

export async function signalsByIds(owner: string, ids: string[]) {
  if (!ids.length) return [];
  return getDb().select().from(signals).where(and(eq(signals.ownerEmail, owner), inArray(signals.id, ids)));
}
