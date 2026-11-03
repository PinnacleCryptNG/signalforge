import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { sources } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, nowIso } from "../server/lib/store.js";

export default defineAction({
  description:
    "Decide on sources. The user approves or rejects; only approved sources can be cited in a brief. When the agent calls this, the decision is saved as a recommendation with a short note and the source stays pending until the user decides.",
  schema: z.object({
    ids: z.array(z.string()).min(1).max(40),
    decision: z.enum(["approve", "reject", "pending"]),
    note: z.string().max(300).optional().describe("One line on credibility or relevance"),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCaller(ctx?.caller);
    const db = getDb();
    const where = and(eq(sources.ownerEmail, owner), inArray(sources.id, args.ids));
    const found = await db.select({ id: sources.id }).from(sources).where(where);
    if (!found.length) fail("No matching sources.", { errorCode: "not_found", statusCode: 404 });
    const patch =
      actor === "user"
        ? {
            status: args.decision === "approve" ? ("approved" as const) : args.decision === "reject" ? ("rejected" as const) : ("pending" as const),
            decidedBy: "user" as const,
          }
        : { recommendation: args.decision === "pending" ? ("" as const) : args.decision };
    await db
      .update(sources)
      .set({ ...patch, ...(args.note !== undefined ? { note: args.note } : {}), updatedAt: nowIso() })
      .where(where);
    return {
      updated: found.length,
      ...(actor === "agent" ? { recorded: "recommendation", hint: "The user makes the final call on each source." } : {}),
    };
  },
});
