import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { drafts } from "../server/db/schema.js";
import { limitProblem } from "../server/lib/drafts.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, nowIso } from "../server/lib/store.js";

export default defineAction({
  description:
    "Edit one draft (title, body) or, for the user only, approve it. Use this to rewrite a draft when the user asks (punchier, shorter, another tone). Agent rewrites must stay within the platform limit, keep to the brief's facts, and send the draft back to status draft (and off the calendar) for the user to re-approve.",
  schema: z.object({
    id: z.string(),
    title: z.string().max(160).optional(),
    body: z.string().min(1).max(8000).optional(),
    status: z.enum(["draft", "approved"]).optional().describe("Only the user can approve. Moving a scheduled draft back to draft takes it off the calendar."),
  }),
  http: { method: "POST" },
  run: async ({ id, ...patch }, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCaller(ctx?.caller);
    const db = getDb();
    const [row] = await db.select().from(drafts).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, id)));
    if (!row) fail(`Draft ${id} not found.`, { errorCode: "not_found", statusCode: 404 });
    if (actor === "agent" && patch.status === "approved") fail("Only the user can approve a draft.", { errorCode: "user_only", statusCode: 403 });

    const body = patch.body?.trim() ?? row!.body;
    const problem = limitProblem(row!.platform, body);
    if (problem && (actor === "agent" || patch.status === "approved")) fail(`${problem} Shorten it first.`, { errorCode: "over_limit", statusCode: 400 });

    const textEdit = patch.body !== undefined || patch.title !== undefined;
    await db
      .update(drafts)
      .set({
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.body !== undefined ? { body } : {}),
        ...(textEdit ? { editedBy: actor } : {}),
        status: patch.status ?? (textEdit && actor === "agent" ? "draft" : row!.status),
        ...((patch.status === "draft" || (textEdit && actor === "agent")) && row!.scheduledFor ? { scheduledFor: null } : {}),
        updatedAt: nowIso(),
      })
      .where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, id)));
    const [fresh] = await db.select().from(drafts).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, id)));
    return { draft: fresh, overLimit: limitProblem(fresh!.platform, fresh!.body) };
  },
});
