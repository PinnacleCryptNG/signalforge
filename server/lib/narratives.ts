import type { Feed, Stage } from "../db/schema.js";
import type { RawSignal } from "./feeds.js";

const STOP = new Set(
  `a an the and or but of to in on for with at by from as is are was were be been being it its this that these those into over under about after before than then
  new news how why what who when where which will would can could should may might just more most less very also not no yes you your we our they their he she his her
  i me my us them vs via per amid says said say report reports update updates today week year years day days month months first last next top best big now get gets got
  one two three four five six seven eight nine ten here there out up down off all any some many much only own same other such each both few against between during without
  within across through show ask tell video watch live latest breaking official full de la le el en et un une des using use used need needs has have had team does did make makes made take takes like want wants going way ways look looks thing things people time times part set sets back still even well really know think see seen pageviews monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december inc ltd com www http https amp`
    .split(/\s+/)
    .filter(Boolean),
);

const FEED_WEIGHT: Record<Feed, number> = { news: 1.1, hackernews: 1, reddit: 0.9, bluesky: 0.8, wikipedia: 0.7, trends: 1.2 };
const DAY = 86_400_000;

export function tokens(text: string, exclude: Set<string>): string[] {
  return text
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .split(/[^a-z0-9+#.-]+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w) && ![...exclude].some((x) => sameRoot(w, x)));
}

/** "agents"/"agent", "african"/"africa": treat words that share a long prefix with a niche word as the niche itself. */
function sameRoot(a: string, b: string): boolean {
  if (a === b) return true;
  const n = Math.min(a.length, b.length);
  if (n < 4) return false;
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i >= Math.min(n, 5) && Math.abs(a.length - b.length) <= 3;
}

export function signalScore(s: RawSignal, now = Date.now()): number {
  const ageDays = s.publishedAt ? Math.max(0, (now - new Date(s.publishedAt).getTime()) / DAY) : 5;
  const recency = Math.exp(-ageDays / 4);
  const reach = Math.log1p(s.engagement);
  return Math.round(100 * FEED_WEIGHT[s.feed] * (0.6 * recency + 0.4) * (1 + reach / 4));
}

export type DraftNarrative = {
  title: string;
  thesis: string;
  whyNow: string;
  keywords: string[];
  members: number[];
  momentum: number;
  stage: Stage;
};

/** Name a cluster after its strongest headline (publisher suffix removed), falling back to the shared term. */
function headline(t: string, term: string): string {
  const clean = t.replace(/\s+[-–|]\s+[^-–|]{2,40}$/, "").trim();
  if (clean.length < 12) return titleCase(term);
  return clean.length <= 84 ? clean : `${clean.slice(0, 84).replace(/\s+\S*$/, "")}…`;
}

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\bAi\b/g, "AI");

/**
 * Groups signals by shared terms: the heaviest recurring phrase seeds a narrative and claims the signals
 * that mention it. A starting point the agent sharpens with update-narrative.
 */
export function clusterSignals(niche: string, rows: RawSignal[], now = Date.now()): DraftNarrative[] {
  const exclude = new Set(tokens(niche, new Set()));
  const scores = rows.map((r) => signalScore(r, now));
  const terms = rows.map((r) => {
    const t = tokens(`${r.title} ${r.snippet}`, exclude);
    const grams = new Set<string>(t);
    for (let i = 0; i < t.length - 1; i++) if (t[i]! !== t[i + 1]!) grams.add(`${t[i]!} ${t[i + 1]!}`);
    return grams;
  });

  const weight = new Map<string, { w: number; docs: number[]; feeds: Set<Feed> }>();
  terms.forEach((set, i) => {
    for (const g of set) {
      const e = weight.get(g) ?? { w: 0, docs: [], feeds: new Set<Feed>() };
      e.w += scores[i]!;
      e.docs.push(i);
      e.feeds.add(rows[i]!.feed);
      weight.set(g, e);
    }
  });

  const ranked = [...weight.entries()]
    .filter(([g, e]) => e.docs.length >= (g.includes(" ") ? 2 : 3) && e.docs.length <= Math.max(4, rows.length * 0.4))
    .map(([g, e]) => [g, e.w * (1 + 0.35 * (e.feeds.size - 1)) * (g.includes(" ") ? 1.6 : 1)] as const)
    .sort((a, b) => b[1] - a[1]);

  const used = new Set<number>();
  const out: DraftNarrative[] = [];
  for (const [term] of ranked) {
    if (out.length >= 6) break;
    if (out.some((n) => n.keywords.some((k) => k.includes(term) || term.includes(k)))) continue;
    const members = weight.get(term)!.docs.filter((i) => !used.has(i));
    if (members.length < 2) continue;
    members.forEach((i) => used.add(i));
    members.sort((a, b) => scores[b]! - scores[a]!);

    const related = new Map<string, number>();
    for (const i of members) for (const g of terms[i]!) if (!g.includes(" ") && !term.split(" ").includes(g)) related.set(g, (related.get(g) ?? 0) + 1);
    const extra = [...related.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

    const feeds = new Set(members.map((i) => rows[i]!.feed));
    const fresh = members.filter((i) => rows[i]!.publishedAt && now - new Date(rows[i]!.publishedAt!).getTime() < 2 * DAY).length;
    const reach = members.reduce((a, i) => a + rows[i]!.engagement, 0);
    const top = rows[members[0]!]!;
    out.push({
      title: headline(top.title, term),
      thesis: `${members.length} signals from ${listFeeds(feeds)} are clustering around “${term}”${extra.length ? `, with talk of ${extra.join(", ")}` : ""}.`,
      whyNow: `Top signal: "${top.title}"${top.publisher ? ` (${top.publisher})` : ""}.`,
      keywords: [term, ...extra],
      members,
      momentum: members.reduce((a, i) => a + scores[i]!, 0) * (1 + 0.35 * (feeds.size - 1)),
      stage: stageFor(members.length, fresh, reach, feeds.size),
    });
  }

  const max = Math.max(1, ...out.map((n) => n.momentum));
  return out.map((n) => ({ ...n, momentum: Math.max(8, Math.round((n.momentum / max) * 100)) }));
}

const FEED_NAMES: Record<string, string> = {
  hackernews: "Hacker News",
  reddit: "Reddit",
  news: "Google News",
  trends: "Google Trends",
  wikipedia: "Wikipedia",
  bluesky: "Bluesky",
};

function listFeeds(feeds: Set<string>) {
  const names = [...feeds].map((f) => FEED_NAMES[f] ?? f);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0]!;
}

function stageFor(count: number, fresh: number, reach: number, feedCount: number): Stage {
  const freshShare = fresh / count;
  if (count >= 6 && feedCount >= 3 && reach > 400) return "peaking";
  if (freshShare >= 0.5 && count <= 4) return "emerging";
  if (freshShare >= 0.3 || feedCount >= 3) return "rising";
  return freshShare === 0 ? "cooling" : "emerging";
}
