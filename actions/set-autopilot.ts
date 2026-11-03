import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { narratives } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getNarrative, nowIso } from "../server/lib/store.js";

export default defineAction({
  description:
    "User only: turn Autopilot on or off for a narrative. On picks it onto the Forge; while on, the agent's source picks for it are applied directly instead of waiting as recommendations. Drafts still need the user's approval.",
  schema: z.object({ id: z.string(), on: z.boolean().default(true) }),
  http: { method: "POST" },
  agentTool: false,
  run: async ({ id, on }, ctx) => {
    const owner = requireOwner(ctx);
    if (actorFromCaller(ctx?.caller) !== "user") fail("Only the user can turn Autopilot on or off.", { errorCode: "user_only", statusCode: 403 });
    const current = await getNarrative(owner, id);
    let targetId = id;
    if (on && current.status !== "picked") {
      const [already] = await getDb()
        .select({ id: narratives.id })
        .from(narratives)
        .where(
          and(
            eq(narratives.ownerEmail, owner),
            eq(narratives.status, "picked"),
            ne(narratives.id, id),
            sql`lower(${narratives.title}) = ${current.title.toLowerCase()}`,
          ),
        );
      if (already) targetId = already.id;
    }
    await getDb()
      .update(narratives)
      .set({ autopilot: on ? 1 : 0, ...(on ? { status: "picked" as const } : {}), updatedAt: nowIso() })
      .where(and(eq(narratives.ownerEmail, owner), eq(narratives.id, targetId)));
    return getNarrative(owner, targetId);
  },
});
