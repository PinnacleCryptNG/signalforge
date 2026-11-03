import { defineAction } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { NARRATIVE_STATUSES, narratives, STAGES } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getNarrative, nowIso } from "../server/lib/store.js";

export default defineAction({
  description: "Edit a narrative (title, thesis, why now, stage) or set its status: picked (work on it), dismissed (hide), new.",
  schema: z.object({
    id: z.string(),
    title: z.string().min(3).max(90).optional(),
    thesis: z.string().max(400).optional(),
    whyNow: z.string().max(400).optional(),
    stage: z.enum(STAGES).optional(),
    status: z.enum(NARRATIVE_STATUSES).optional(),
  }),
  http: { method: "POST" },
  run: async ({ id, ...patch }, ctx) => {
    const owner = requireOwner(ctx);
    await getNarrative(owner, id);
    const textEdit = patch.title !== undefined || patch.thesis !== undefined || patch.whyNow !== undefined;
    await getDb()
      .update(narratives)
      .set({ ...patch, ...(textEdit ? { editedBy: actorFromCaller(ctx?.caller) } : {}), updatedAt: nowIso() })
      .where(and(eq(narratives.ownerEmail, owner), eq(narratives.id, id)));
    return getNarrative(owner, id);
  },
});
