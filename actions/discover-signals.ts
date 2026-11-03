import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { requireOwner } from "../server/lib/owner.js";
import { getBoard, runScan } from "../server/lib/store.js";

export default defineAction({
  description:
    "Scan free public feeds (Google News, Hacker News, Reddit, Bluesky, Wikipedia pageviews, Google Trends) for what's rising in a niche. Stores the signals and a first keyword clustering into narratives, then returns the board. Call save-narratives afterwards to replace the rough clusters with real narratives.",
  schema: z.object({
    niche: z.string().min(2).max(80).describe('Topic or niche, e.g. "fintech in Africa" or "AI agents"'),
    region: z.string().length(2).default("US").describe("Two-letter country code for news and trends, e.g. US, NG, GB"),
  }),
  http: { method: "POST" },
  run: async ({ niche, region }, ctx) => {
    const owner = requireOwner(ctx);
    const result = await runScan(owner, niche.trim(), region.toUpperCase());
    const board = await getBoard(owner, result.scanId);
    return {
      ...result,
      narratives: board.narratives.map((n) => ({ id: n.id, title: n.title, momentum: n.momentum, stage: n.stage, signalIds: n.signalIds })),
      topSignals: board.signals.slice(0, 40).map((s) => ({ id: s.id, feed: s.feed, title: s.title, publisher: s.publisher, publishedAt: s.publishedAt, engagement: s.engagement })),
    };
  },
});
