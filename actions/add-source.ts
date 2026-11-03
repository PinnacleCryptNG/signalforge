import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { addSource } from "../server/lib/forge.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller } from "../server/lib/store.js";

export default defineAction({
  description:
    "Add one source link to a narrative. The page is read for its title and an excerpt. Links the user adds are approved; links the agent adds stay pending until the user approves them. Only add real URLs you have seen.",
  schema: z.object({
    narrativeId: z.string(),
    url: z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links can be sources"),
    title: z.string().max(300).optional(),
    note: z.string().max(300).optional().describe("Why this source matters"),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => addSource(requireOwner(ctx), args.narrativeId, actorFromCaller(ctx?.caller), args),
});
