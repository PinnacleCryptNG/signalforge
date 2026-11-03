import { fail } from "@agent-native/core/action";
import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "../db/index.js";
import { briefs, narratives, scans, sources, type Actor, type SignalRow, type SourceRow } from "../db/schema.js";
import { searchFeeds } from "./feeds.js";
import { signalScore } from "./narratives.js";
import { hostOf, isHttpUrl, readPage } from "./research.js";
import { getNarrative, newId, nowIso, parseList, signalsByIds } from "./store.js";

export type KeyPoint = { point: string; sourceIds: string[] };

export function parseKeyPoints(s: string): KeyPoint[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v)
      ? v.map((k) => (typeof k === "string" ? { point: k, sourceIds: [] } : { point: String(k.point ?? ""), sourceIds: (k.sourceIds ?? []).map(String) }))
      : [];
  } catch {
    return [];
  }
}

const sourceOrder = (a: SourceRow, b: SourceRow) =>
  ["approved", "pending", "rejected"].indexOf(a.status) - ["approved", "pending", "rejected"].indexOf(b.status) ||
  b.updatedAt.localeCompare(a.updatedAt);

export async function listSources(owner: string, narrativeId: string) {
  const rows = await getDb()
    .select()
    .from(sources)
    .where(and(eq(sources.ownerEmail, owner), eq(sources.narrativeId, narrativeId)));
  return rows.sort(sourceOrder);
}

export async function getBrief(owner: string, narrativeId: string) {
  const [row] = await getDb()
    .select()
    .from(briefs)
    .where(and(eq(briefs.ownerEmail, owner), eq(briefs.narrativeId, narrativeId)));
  return row ? { ...row, keyPoints: parseKeyPoints(row.keyPoints), sourceIds: parseList(row.sourceIds) } : null;
}

export async function getForge(owner: string, narrativeId?: string) {
  const db = getDb();
  const picked = await db
    .select()
    .from(narratives)
    .where(and(eq(narratives.ownerEmail, owner), eq(narratives.status, "picked")))
    .orderBy(desc(narratives.updatedAt));
  const pickedIds = picked.map((p) => p.id);
  const [srcRows, briefRows] = pickedIds.length
    ? await Promise.all([
        db.select({ narrativeId: sources.narrativeId, status: sources.status }).from(sources).where(and(eq(sources.ownerEmail, owner), inArray(sources.narrativeId, pickedIds))),
        db.select({ narrativeId: briefs.narrativeId }).from(briefs).where(and(eq(briefs.ownerEmail, owner), inArray(briefs.narrativeId, pickedIds))),
      ])
    : [[], []];
  const withBrief = new Set(briefRows.map((b) => b.narrativeId));
  const queue = picked.map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    momentum: p.momentum,
    sources: srcRows.filter((s) => s.narrativeId === p.id).length,
    approved: srcRows.filter((s) => s.narrativeId === p.id && s.status === "approved").length,
    hasBrief: withBrief.has(p.id),
  }));

  const selectedId = narrativeId ?? queue[0]?.id;
  if (!selectedId) return { queue, selected: null };
  const narrative = await getNarrative(owner, selectedId);
  const [[scan], evidence, srcs, brief] = await Promise.all([
    db.select().from(scans).where(and(eq(scans.ownerEmail, owner), eq(scans.id, narrative.scanId))),
    signalsByIds(owner, narrative.signalIds),
    listSources(owner, selectedId),
    getBrief(owner, selectedId),
  ]);
  const approvedIds = new Set(srcs.filter((s) => s.status === "approved").map((s) => s.id));
  return {
    queue,
    selected: {
      narrative,
      niche: scan?.niche ?? "",
      region: scan?.region ?? "US",
      evidence: evidence.sort((a, b) => b.score - a.score),
      sources: srcs,
      brief: brief && { ...brief, unapprovedCitations: brief.sourceIds.filter((id) => !approvedIds.has(id)) },
    },
  };
}

type Candidate = { url: string; title: string; publisher: string; excerpt: string; publishedAt: string | null };

function fromSignal(s: Pick<SignalRow, "url" | "title" | "publisher" | "snippet" | "publishedAt">): Candidate {
  return { url: s.url, title: s.title, publisher: s.publisher, excerpt: s.snippet, publishedAt: s.publishedAt };
}

async function enrich(c: Candidate): Promise<Candidate> {
  const page = await readPage(c.url);
  if (!page) return c;
  return {
    url: c.url,
    title: c.title || page.title,
    publisher: c.publisher || page.publisher,
    excerpt: page.excerpt.length > c.excerpt.length ? page.excerpt : c.excerpt,
    publishedAt: c.publishedAt ?? page.publishedAt,
  };
}

/** Collects candidate sources for a narrative: its own evidence plus a fresh search, each read for an excerpt. All land as pending. */
export async function researchNarrative(owner: string, narrativeId: string, actor: Actor, opts: { query?: string | undefined; max: number }) {
  const db = getDb();
  const narrative = await getNarrative(owner, narrativeId);
  const [scan] = await db.select().from(scans).where(and(eq(scans.ownerEmail, owner), eq(scans.id, narrative.scanId)));
  const existing = await listSources(owner, narrativeId);
  const seen = new Set(existing.map((s) => s.url));

  const evidence = (await signalsByIds(owner, narrative.signalIds)).sort((a, b) => b.score - a.score);
  const query = (opts.query?.trim() || (narrative.keywords.length ? narrative.keywords.slice(0, 3).join(" ") : narrative.title)).slice(0, 120);
  const { rows, failed } = await searchFeeds(query, scan?.region ?? "US");

  const picked: Candidate[] = [];
  const take = (c: Candidate) => {
    if (picked.length >= opts.max || !isHttpUrl(c.url) || seen.has(c.url)) return;
    seen.add(c.url);
    picked.push(c);
  };
  evidence.slice(0, Math.ceil(opts.max / 2)).forEach((s) => take(fromSignal(s)));
  rows.sort((a, b) => signalScore(b) - signalScore(a)).forEach((r) => take(fromSignal(r)));

  const enriched = await Promise.all(picked.map(enrich));
  const now = nowIso();
  const inserted = enriched.map((c) => ({
    id: newId("src"),
    ownerEmail: owner,
    narrativeId,
    url: c.url,
    title: c.title.slice(0, 300),
    publisher: c.publisher || hostOf(c.url),
    excerpt: c.excerpt,
    publishedAt: c.publishedAt,
    status: "pending" as const,
    addedBy: "agent" as const,
    decidedBy: "agent" as const,
    updatedAt: now,
  }));
  if (inserted.length) await db.insert(sources).values(inserted);
  return { query, added: inserted.length, alreadyHad: existing.length, failedFeeds: failed, sources: await listSources(owner, narrativeId) };
}

export async function addSource(owner: string, narrativeId: string, actor: Actor, input: { url: string; title?: string | undefined; note?: string | undefined }) {
  if (!isHttpUrl(input.url)) fail("Use a full http(s) link.", { errorCode: "bad_url", statusCode: 400 });
  await getNarrative(owner, narrativeId);
  const existing = await listSources(owner, narrativeId);
  const dupe = existing.find((s) => s.url === input.url);
  if (dupe) return { source: dupe, duplicate: true };
  const page = await readPage(input.url);
  const title = input.title?.trim() || page?.title || hostOf(input.url);
  const row = {
    id: newId("src"),
    ownerEmail: owner,
    narrativeId,
    url: input.url,
    title: title.slice(0, 300),
    publisher: page?.publisher || hostOf(input.url),
    excerpt: page?.excerpt ?? "",
    publishedAt: page?.publishedAt ?? null,
    // A link the user adds is their decision; one the agent adds still waits for the user.
    status: actor === "user" ? ("approved" as const) : ("pending" as const),
    decidedBy: actor,
    addedBy: actor,
    note: input.note ?? "",
    updatedAt: nowIso(),
  };
  await getDb().insert(sources).values(row);
  return { source: row, duplicate: false, readable: !!page };
}
