export type Feed = "hackernews" | "reddit" | "news" | "trends" | "wikipedia" | "bluesky";
export type Stage = "emerging" | "rising" | "peaking" | "cooling";

export type Signal = {
  id: string;
  feed: Feed;
  title: string;
  url: string;
  snippet: string;
  publisher: string;
  publishedAt: string | null;
  engagement: number;
  score: number;
};

export type Narrative = {
  id: string;
  scanId: string;
  title: string;
  thesis: string;
  whyNow: string;
  keywords: string[];
  signalIds: string[];
  momentum: number;
  stage: Stage;
  status: "new" | "picked" | "dismissed";
  editedBy: "user" | "agent";
  autopilot: number;
  updatedAt: string;
};

export type FeedStat = { feed: Feed; ok: boolean; count: number; error?: string };

export type Board = {
  scan: { id: string; niche: string; region: string; createdAt: string; feedStats: FeedStat[] } | null;
  narratives: Narrative[];
  signals: Signal[];
};

export const FEED_META: Record<Feed, { label: string; tag: string; color: string }> = {
  news: { label: "Google News", tag: "NEWS", color: "#7cc4ff" },
  hackernews: { label: "Hacker News", tag: "HN", color: "#ff8a1f" },
  reddit: { label: "Reddit", tag: "RDT", color: "#ff5a36" },
  bluesky: { label: "Bluesky", tag: "BSKY", color: "#5fa8ff" },
  wikipedia: { label: "Wikipedia", tag: "WIKI", color: "#d9cbb8" },
  trends: { label: "Google Trends", tag: "TRND", color: "#ffd166" },
};

export const STAGE_META: Record<Stage, { label: string; hint: string; className: string }> = {
  emerging: { label: "Emerging", hint: "Few signals, very recent", className: "text-[#ffd08a] border-[#ffd08a]/40" },
  rising: { label: "Rising", hint: "Spreading across feeds", className: "text-[#ff8a1f] border-[#ff8a1f]/50" },
  peaking: { label: "Peaking", hint: "Loud right now, act fast", className: "text-[#ff4a1a] border-[#ff4a1a]/60" },
  cooling: { label: "Cooling", hint: "Past its peak", className: "text-[#8fa3b8] border-[#8fa3b8]/40" },
};

export const REGIONS = ["US", "GB", "NG", "KE", "ZA", "IN", "CA", "AU", "DE", "FR", "BR"] as const;

export const SUGGESTED_NICHES = ["AI agents", "fintech in Africa", "creator economy", "climate tech", "longevity"];

export function ago(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`;
}
