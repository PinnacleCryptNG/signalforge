import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { narratives, STAGES } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getBoard, newId, nowIso } from "../server/lib/store.js";

export default defineAction({
  description:
    "Replace a scan's rough keyword clusters with synthesized narratives: a sharp title, a one-sentence thesis, why it is rising now, and the signal ids that back it. Narratives the user picked or edited are kept.",
  schema: z.object({
    scanId: z.string(),
    narratives: z
      .array(
        z.object({
          title: z.string().min(3).max(90).describe("Short, specific narrative name, e.g. 'Stablecoins become Africa's remittance rail'"),
          thesis: z.string().max(400).describe("One sentence: what is changing"),
          whyNow: z.string().max(400).describe("One sentence: the trigger making it rise now, citing a signal"),
          keywords: z.array(z.string()).max(6).default([]),
          signalIds: z.array(z.string()).min(1).describe("Ids of the signals that back this narrative"),
          momentum: z.coerce.number().int().min(1).max(100).describe("0-100 relative heat"),
          stage: z.enum(STAGES),
        }),
      )
      .min(1)
      .max(8),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const board = await getBoard(owner, args.scanId);
    if (!board.scan) fail(`Scan ${args.scanId} not found.`, { errorCode: "not_found", statusCode: 404 });
    const known = new Set(board.signals.map((s) => s.id));
    const actor = actorFromCaller(ctx?.caller);
    const db = getDb();
    await db
      .delete(narratives)
      .where(and(eq(narratives.ownerEmail, owner), eq(narratives.scanId, args.scanId), eq(narratives.editedBy, "agent"), ne(narratives.status, "picked")));
    const rows = args.narratives.map((n) => ({
      id: newId("nar"),
      ownerEmail: owner,
      scanId: args.scanId,
      title: n.title,
      thesis: n.thesis,
      whyNow: n.whyNow,
      keywords: JSON.stringify(n.keywords),
      signalIds: JSON.stringify(n.signalIds.filter((id) => known.has(id))),
      momentum: n.momentum,
      stage: n.stage,
      editedBy: actor,
      updatedAt: nowIso(),
    }));
    await db.insert(narratives).values(rows);
    return { saved: rows.length, ids: rows.map((r) => r.id) };
  },
});
