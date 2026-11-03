import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { researchNarrative } from "../server/lib/forge.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller } from "../server/lib/store.js";

export default defineAction({
  description:
    "Research a picked narrative: gather candidate sources from its own evidence plus a fresh search of Google News, Hacker News, Wikipedia and Bluesky, read each page for an excerpt, and store them as pending sources for the user to approve. Pass a sharper query to search a specific angle; run again to add more.",
  schema: z.object({
    narrativeId: z.string(),
    query: z.string().max(120).optional().describe("Search query; defaults to the narrative's keywords or title"),
    max: z.coerce.number().int().min(1).max(15).default(10),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => researchNarrative(requireOwner(ctx), args.narrativeId, actorFromCaller(ctx?.caller), args),
});
