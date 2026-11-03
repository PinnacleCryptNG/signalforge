import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { narratives, sources } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, nowIso } from "../server/lib/store.js";

const STATUS = { approve: "approved", reject: "rejected", pending: "pending" } as const;

export default defineAction({
  description:
    "Decide on sources. The user approves or rejects; only approved sources can be cited in a brief. When the agent calls this, the decision is saved as a recommendation and the source stays pending for the user, except on narratives where the user turned Autopilot on: there the agent's call is applied (never over a decision the user made or a link the user added).",
  schema: z.object({
    ids: z.array(z.string()).min(1).max(40),
    decision: z.enum(["approve", "reject", "pending"]),
    note: z.string().max(300).nullish().describe("One line on credibility or relevance"),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCaller(ctx?.caller);
    const db = getDb();
    const found = await db
      .select({ id: sources.id, narrativeId: sources.narrativeId, decidedBy: sources.decidedBy, addedBy: sources.addedBy })
      .from(sources)
      .where(and(eq(sources.ownerEmail, owner), inArray(sources.id, args.ids)));
    if (!found.length) fail("No matching sources.", { errorCode: "not_found", statusCode: 404 });
    const note = args.note != null ? { note: args.note } : {};
    const byIds = (ids: string[]) => and(eq(sources.ownerEmail, owner), inArray(sources.id, ids));

    if (actor === "user") {
      await db
        .update(sources)
        .set({ status: STATUS[args.decision], decidedBy: "user", ...note, updatedAt: nowIso() })
        .where(byIds(found.map((s) => s.id)));
      return { updated: found.length };
    }

    const autoNarratives = new Set(
      (
        await db
          .select({ id: narratives.id })
          .from(narratives)
          .where(and(eq(narratives.ownerEmail, owner), eq(narratives.autopilot, 1), inArray(narratives.id, [...new Set(found.map((s) => s.narrativeId))])))
      ).map((r) => r.id),
    );
    const applied = found.filter((s) => autoNarratives.has(s.narrativeId) && s.decidedBy !== "user" && s.addedBy !== "user").map((s) => s.id);
    const recommendation = args.decision === "pending" ? ("" as const) : args.decision;
    await db
      .update(sources)
      .set({ recommendation, ...note, updatedAt: nowIso() })
      .where(byIds(found.map((s) => s.id)));
    if (applied.length)
      await db.update(sources).set({ status: STATUS[args.decision], decidedBy: "agent" }).where(byIds(applied));
    return {
      updated: found.length,
      applied: applied.length,
      recorded: applied.length === found.length ? "decision (Autopilot)" : "recommendation",
      ...(applied.length < found.length ? { hint: "Outside Autopilot the user makes the final call on each source." } : {}),
    };
  },
});
