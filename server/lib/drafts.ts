import { and, eq } from "drizzle-orm";

import { getDb } from "../db/index.js";
import { drafts, PLATFORMS, type Platform } from "../db/schema.js";

export const PLATFORM_SPECS: Record<Platform, { label: string; limit: number; needsTitle: boolean; guide: string }> = {
  x: { label: "X", limit: 280, needsTitle: false, guide: "A hook post or a thread of up to 6 posts, each at most 280 characters (aim for 240); separate posts with a line containing only ---." },
  linkedin: { label: "LinkedIn", limit: 3000, needsTitle: false, guide: "A strong first line, short paragraphs, a clear takeaway, at most 3000 characters." },
  instagram: { label: "Instagram", limit: 2200, needsTitle: false, guide: "A caption with a hook line, a short story, the call to action and a few hashtags, at most 2200 characters." },
  newsletter: { label: "Newsletter", limit: 6000, needsTitle: true, guide: "title is the email subject line; body is a short issue with sources linked inline, at most 6000 characters." },
  video: { label: "Short video", limit: 2500, needsTitle: true, guide: "title is the video title; body is a 45-60 second script with [HOOK], [BODY] and [CTA] beats plus on-screen text cues, at most 2500 characters." },
};

export const THREAD_SPLIT = /\n\s*---\s*\n/;

/** Returns a reason the body breaks the platform's limits, or null when it fits. */
export function limitProblem(platform: Platform, body: string): string | null {
  const spec = PLATFORM_SPECS[platform];
  if (platform === "x") {
    const posts = body.split(THREAD_SPLIT).map((p) => p.trim()).filter(Boolean);
    if (posts.length > 6) return "An X thread can have at most 6 posts.";
    const long = posts.findIndex((p) => [...p].length > spec.limit);
    if (long < 0) return null;
    const n = [...posts[long]!].length;
    return `X post ${long + 1} is ${n} characters, ${n - spec.limit} over the ${spec.limit} limit. Cut at least ${n - spec.limit} characters or split it into more posts.`;
  }
  const n = [...body].length;
  return n > spec.limit ? `${spec.label} is ${n} characters, ${n - spec.limit} over the ${spec.limit} limit. Cut at least ${n - spec.limit} characters.` : null;
}

const chars = (s: string) => [...s].length;

/** Splits over-long X posts into a thread at paragraph, then sentence, breaks without changing any words. Returns the body unchanged when that can't fit. */
export function fitXThread(body: string): string {
  const limit = PLATFORM_SPECS.x.limit;
  const posts = body.split(THREAD_SPLIT).map((p) => p.trim()).filter(Boolean);
  if (posts.every((p) => chars(p) <= limit)) return body;
  const out: string[] = [];
  for (const post of posts) {
    if (chars(post) <= limit) {
      out.push(post);
      continue;
    }
    const pieces = post.split(/\n\s*\n/).flatMap((para, i) => {
      const parts = chars(para) <= limit ? [para.trim()] : (para.match(/[^.!?…]+(?:[.!?…]+["'”’)]*|$)/g) ?? [para]).map((s) => s.trim()).filter(Boolean);
      return parts.map((text, j) => ({ text, sep: j === 0 && i > 0 ? "\n\n" : " " }));
    });
    let cur = "";
    for (const { text, sep } of pieces) {
      if (chars(text) > limit) return body;
      if (cur && chars(cur + sep + text) > limit) {
        out.push(cur);
        cur = text;
      } else cur = cur ? cur + sep + text : text;
    }
    if (cur) out.push(cur);
  }
  return out.length <= 6 ? out.join("\n---\n") : body;
}

export async function listDrafts(owner: string, narrativeId: string) {
  const rows = await getDb()
    .select()
    .from(drafts)
    .where(and(eq(drafts.ownerEmail, owner), eq(drafts.narrativeId, narrativeId)));
  return rows.sort((a, b) => PLATFORMS.indexOf(a.platform) - PLATFORMS.indexOf(b.platform));
}
