import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { getForge } from "../server/lib/forge.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description:
    "Read the Forge: the queue of picked narratives (with source and brief progress) and, for one narrative, its evidence signals, sources (pending, approved, rejected, with your recommendations) and brief. Defaults to the most recently picked narrative.",
  schema: z.object({ narrativeId: z.string().optional() }),
  http: { method: "GET" },
  readOnly: true,
  run: async (args, ctx) => getForge(requireOwner(ctx), args.narrativeId),
});
