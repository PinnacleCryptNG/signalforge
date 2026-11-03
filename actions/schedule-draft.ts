import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { drafts } from "../server/db/schema.js";
import { SLOT_MINUTES, slotClash } from "../server/lib/calendar.js";
import { PLATFORM_SPECS } from "../server/lib/drafts.js";
import { requireOwner } from "../server/lib/owner.js";
import { nowIso } from "../server/lib/store.js";

export default defineAction({
  description: `Put an approved draft on the calendar, move it, take it off (scheduledFor: null), or mark it published after the user posted it themselves (published: true). Only drafts the user approved can be scheduled. A platform can't have two posts within ${SLOT_MINUTES} minutes of each other. SignalForge never posts anywhere; publishing is the user copying the draft.`,
  schema: z.object({
    id: z.string(),
    scheduledFor: z
      .preprocess((v) => (v === "null" || v === "" ? null : v), z.string().datetime({ offset: true }).nullable())
      .optional().describe("ISO datetime with offset, or null to unschedule"),
    published: z.boolean().optional(),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const db = getDb();
    const [row] = await db.select().from(drafts).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, args.id)));
    if (!row) fail(`Draft ${args.id} not found.`, { errorCode: "not_found", statusCode: 404 });
    const d = row!;
    if (d.status === "draft") fail("Approve this draft before it goes on the calendar.", { errorCode: "not_approved", statusCode: 409 });

    let scheduledFor = d.scheduledFor;
    if (args.scheduledFor !== undefined) {
      if (args.scheduledFor === null) scheduledFor = null;
      else {
        const at = new Date(args.scheduledFor);
        if (at.getTime() < Date.now() - 5 * 60_000 && !(args.published ?? d.status === "published")) {
          fail("That time has already passed. Pick a time from now on.", { errorCode: "in_past", statusCode: 400 });
        }
        const clash = await slotClash(owner, d.platform, at, d.id);
        if (clash) {
          fail(
            `That slot is taken: another ${PLATFORM_SPECS[d.platform].label} post (${clash.id}) is at ${clash.scheduledFor}. Keep ${SLOT_MINUTES} minutes between posts on the same platform.`,
            { errorCode: "slot_taken", statusCode: 409 },
          );
        }
        scheduledFor = at.toISOString();
      }
    }
    const published = args.published ?? d.status === "published";
    if (published && !scheduledFor) scheduledFor = nowIso();
    const status = published ? "published" : scheduledFor ? "scheduled" : "approved";

    await db.update(drafts).set({ scheduledFor, status, updatedAt: nowIso() }).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, d.id)));
    const [fresh] = await db.select().from(drafts).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, d.id)));
    return { draft: fresh };
  },
});
