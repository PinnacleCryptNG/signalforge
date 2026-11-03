import { ssrfSafeFetch } from "@agent-native/core/extensions/url-safety";

import { decode, stripTags } from "./feeds.js";

export type PageInfo = { title: string; publisher: string; excerpt: string; publishedAt: string | null };

const UA = "Mozilla/5.0 (compatible; SignalForge/0.1; +https://github.com/PinnacleCryptNG/signalforge)";
/** Hosts whose pages are app shells or redirect walls; the feed's own title and snippet are better. */
const SKIP_HOSTS = ["news.google.com", "bsky.app", "www.reddit.com", "reddit.com", "x.com", "twitter.com"];

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function meta(html: string, key: string): string {
  const k = key.replace(/[:]/g, "\\:");
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i").exec(html);
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, "i").exec(html);
  return decode((a?.[1] ?? b?.[1] ?? "").trim());
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Reads a public article's title, publisher, date and opening text. Returns null when the page can't be read. */
export async function readPage(url: string): Promise<PageInfo | null> {
  if (!isHttpUrl(url) || SKIP_HOSTS.includes(new URL(url).hostname)) return null;
  try {
    const res = await ssrfSafeFetch(
      url,
      { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(8_000) },
      { maxRedirects: 4 },
    );
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    const html = (await res.text()).slice(0, 600_000);
    const title = meta(html, "og:title") || stripTags(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
    const description = meta(html, "og:description") || meta(html, "description");
    const body = html.replace(/<(script|style|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " ");
    const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1]!))
      .filter((p) => p.length > 80)
      .slice(0, 3)
      .join(" ");
    const text = [description, paras].filter(Boolean).join(" — ");
    const published = meta(html, "article:published_time") || meta(html, "date") || null;
    return {
      title: clip(title, 200),
      publisher: meta(html, "og:site_name") || hostOf(url),
      excerpt: clip(stripTags(text), 900),
      publishedAt: published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null,
    };
  } catch {
    return null;
  }
}
