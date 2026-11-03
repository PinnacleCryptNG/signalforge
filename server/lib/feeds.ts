import type { Feed } from "../db/schema.js";

export type RawSignal = {
  feed: Feed;
  title: string;
  url: string;
  snippet: string;
  publisher: string;
  publishedAt: string | null;
  engagement: number;
};

export type FeedResult = { feed: Feed; ok: boolean; count: number; error?: string };

const UA = "Mozilla/5.0 (compatible; SignalForge/0.1; +https://github.com/PinnacleCryptNG/signalforge)";
const DAY = 86_400_000;

async function get(url: string, accept = "application/json"): Promise<Response> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const n = e[1]! === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    });
}
const PICTO = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu;
export const stripTags = (s: string) =>
  decode(decode(s).replace(/<[^>]+>/g, " "))
    .replace(PICTO, "")
    .replace(/\s+([:,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]!).trim() : "";
}
function attr(xml: string, name: string, a: string): string {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${a}="([^"]*)"`, "i"));
  return m ? decode(m[1]!) : "";
}
function blocks(xml: string, name: string): string[] {
  return xml.match(new RegExp(`<${name}[\\s>][\\s\\S]*?</${name}>`, "gi")) ?? [];
}
const iso = (d: string | number | undefined | null) => {
  if (d === undefined || d === null || d === "") return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};
const clip = (s: string, n = 280) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

async function hackerNews(q: string): Promise<RawSignal[]> {
  const since = Math.floor((Date.now() - 21 * DAY) / 1000);
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=30&numericFilters=${encodeURIComponent(`created_at_i>${since}`)}`;
  const data = (await (await get(url)).json()) as {
    hits: { objectID: string; title?: string; url?: string; points?: number; num_comments?: number; created_at?: string; story_text?: string }[];
  };
  return data.hits
    .filter((h) => h.title)
    .map((h) => ({
      feed: "hackernews" as const,
      title: h.title!,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      snippet: clip(stripTags(h.story_text ?? "")),
      publisher: h.url ? new URL(h.url).hostname.replace(/^www\./, "") : "news.ycombinator.com",
      publishedAt: iso(h.created_at),
      engagement: (h.points ?? 0) + (h.num_comments ?? 0),
    }));
}

async function reddit(q: string): Promise<RawSignal[]> {
  const xml = await (await get(`https://www.reddit.com/search.rss?q=${encodeURIComponent(q)}&sort=top&t=week&limit=25`, "application/atom+xml")).text();
  return blocks(xml, "entry").map((e) => ({
    feed: "reddit" as const,
    title: stripTags(tag(e, "title")),
    url: attr(e, "link", "href"),
    snippet: clip(stripTags(tag(e, "content"))),
    publisher: `r/${attr(e, "category", "term") || "reddit"}`,
    publishedAt: iso(tag(e, "updated") || tag(e, "published")),
    engagement: 0,
  }));
}

async function news(q: string, region: string): Promise<RawSignal[]> {
  const gl = region.toUpperCase();
  const xml = await (
    await get(`https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:7d`)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`, "application/rss+xml")
  ).text();
  return blocks(xml, "item")
    .slice(0, 40)
    .map((i) => {
      const publisher = stripTags(tag(i, "source"));
      const title = stripTags(tag(i, "title")).replace(new RegExp(`\\s+-\\s+${publisher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
      return {
        feed: "news" as const,
        title,
        url: tag(i, "link"),
        snippet: "",
        publisher,
        publishedAt: iso(tag(i, "pubDate")),
        engagement: 0,
      };
    });
}

async function trends(region: string): Promise<RawSignal[]> {
  const xml = await (await get(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(region.toUpperCase())}`, "application/rss+xml")).text();
  return blocks(xml, "item").map((i) => {
    const traffic = parseInt(tag(i, "ht:approx_traffic").replace(/[^0-9]/g, ""), 10) || 0;
    const firstNews = blocks(i, "ht:news_item")[0] ?? "";
    return {
      feed: "trends" as const,
      title: stripTags(tag(i, "title")),
      url: tag(firstNews, "ht:news_item_url") || `https://trends.google.com/trends/explore?geo=${region}&q=${encodeURIComponent(stripTags(tag(i, "title")))}`,
      snippet: stripTags(tag(firstNews, "ht:news_item_title")),
      publisher: stripTags(tag(firstNews, "ht:news_item_source")) || "Google Trends",
      publishedAt: iso(tag(i, "pubDate")),
      engagement: traffic,
    };
  });
}

async function wikipedia(q: string): Promise<RawSignal[]> {
  const search = (await (
    await get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&srlimit=6&origin=*`)
  ).json()) as { query?: { search?: { title: string; snippet: string }[] } };
  const pages = search.query?.search ?? [];
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const end = new Date(Date.now() - DAY);
  const start = new Date(Date.now() - 15 * DAY);
  const out = await Promise.all(
    pages.map(async (p) => {
      let recent = 0;
      let lift = 0;
      try {
        const views = (await (
          await get(
            `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(p.title.replace(/ /g, "_"))}/daily/${fmt(start)}/${fmt(end)}`,
          )
        ).json()) as { items?: { views: number }[] };
        const v = (views.items ?? []).map((i) => i.views);
        const last = v.slice(-3);
        const before = v.slice(0, -3);
        recent = last.reduce((a, b) => a + b, 0);
        const avgBefore = before.length ? before.reduce((a, b) => a + b, 0) / before.length : 0;
        const avgLast = last.length ? recent / last.length : 0;
        lift = avgBefore > 0 ? Math.round(((avgLast - avgBefore) / avgBefore) * 100) : 0;
      } catch {
        /* pageviews are optional context */
      }
      return {
        feed: "wikipedia" as const,
        title: p.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
        snippet: clip(`${lift > 0 ? `Pageviews up ${lift}% in the last 3 days. ` : lift < 0 ? `Pageviews down ${-lift}% in the last 3 days. ` : ""}${stripTags(p.snippet)}`),
        publisher: "Wikipedia",
        publishedAt: null,
        engagement: Math.max(0, lift),
      };
    }),
  );
  return out;
}

async function bluesky(q: string): Promise<RawSignal[]> {
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const data = (await (
    await get(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&sort=top&limit=25&since=${encodeURIComponent(since)}`)
  ).json()) as {
    posts?: {
      uri: string;
      author: { handle: string; displayName?: string };
      record: { text?: string; createdAt?: string };
      likeCount?: number;
      repostCount?: number;
      replyCount?: number;
    }[];
  };
  return (data.posts ?? [])
    .filter((p) => p.record.text)
    .map((p) => {
      const text = p.record.text!.replace(/\s+/g, " ").trim();
      return {
        feed: "bluesky" as const,
        title: clip(text, 140),
        url: `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split("/").pop()}`,
        snippet: text.length > 140 ? clip(text) : "",
        publisher: `@${p.author.handle}`,
        publishedAt: iso(p.record.createdAt),
        engagement: (p.likeCount ?? 0) + 2 * (p.repostCount ?? 0) + (p.replyCount ?? 0),
      };
    });
}

/** Pulls fresh signals for a niche from free, keyless public feeds. One failing feed never sinks the scan. */
export async function collectSignals(niche: string, region: string) {
  const jobs: [Feed, () => Promise<RawSignal[]>][] = [
    ["news", () => news(niche, region)],
    ["hackernews", () => hackerNews(niche)],
    ["reddit", () => reddit(niche)],
    ["bluesky", () => bluesky(niche)],
    ["wikipedia", () => wikipedia(niche)],
    ["trends", () => trends(region).then((rows) => onTopic(rows, niche))],
  ];
  const settled = await Promise.allSettled(jobs.map(([, run]) => run()));
  const stats: FeedResult[] = [];
  const all: RawSignal[] = [];
  settled.forEach((r, i) => {
    const feed = jobs[i]![0];
    if (r.status === "fulfilled") {
      const rows = r.value.filter((s) => s.title && s.url);
      stats.push({ feed, ok: true, count: rows.length });
      all.push(...rows);
    } else {
      stats.push({ feed, ok: false, count: 0, error: String((r.reason as Error)?.message ?? r.reason).slice(0, 120) });
    }
  });
  return { signals: dedupe(all), stats };
}

/** Searches the article-style feeds for one research query. Partial failures are reported, not thrown. */
export async function searchFeeds(q: string, region: string) {
  const jobs: [Feed, () => Promise<RawSignal[]>][] = [
    ["news", () => news(q, region)],
    ["hackernews", () => hackerNews(q)],
    ["wikipedia", () => wikipedia(q)],
    ["bluesky", () => bluesky(q)],
  ];
  const settled = await Promise.allSettled(jobs.map(([, run]) => run()));
  const rows: RawSignal[] = [];
  const failed: string[] = [];
  settled.forEach((r, i) => (r.status === "fulfilled" ? rows.push(...r.value.filter((s) => s.title && s.url)) : failed.push(jobs[i]![0])));
  return { rows: dedupe(rows), failed };
}

/** Regional daily trends are mostly unrelated (sports, celebrities); keep only the ones that touch the niche. */
function onTopic(rows: RawSignal[], niche: string): RawSignal[] {
  const words = niche.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return rows.filter((r) => {
    const text = `${r.title} ${r.snippet}`.toLowerCase();
    return words.some((w) => text.includes(w.slice(0, Math.max(4, w.length - 2))));
  });
}

function dedupe(rows: RawSignal[]): RawSignal[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = r.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 80);
    if (seen.has(k) || seen.has(r.url)) return false;
    seen.add(k);
    seen.add(r.url);
    return true;
  });
}
