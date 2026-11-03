import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { briefs, narratives, sources, STAGES } from "../server/db/schema.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getBoard, newId, nowIso } from "../server/lib/store.js";

export default defineAction({
  description:
    "Replace a scan's rough keyword clusters with synthesized narratives: a sharp title, a one-sentence thesis, why it is rising now, and the signal ids that back it. Narratives the user edited are kept. To sharpen a picked narrative, list its id in `replaces`: the new one inherits the pick, sources and brief instead of appearing twice.",
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
          replaces: z.array(z.string()).max(4).default([]).describe("Ids of existing narratives (e.g. a picked one) this narrative supersedes"),
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
    const byId = new Map(board.narratives.map((n) => [n.id, n]));
    // User-edited narratives are never replaced; picked ones only when explicitly superseded.
    const replaceable = (id: string) => byId.has(id) && byId.get(id)!.editedBy !== "user";
    const rows = args.narratives.map((n) => {
      const replaces = n.replaces.filter(replaceable);
      return {
        replaces,
        row: {
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
          status: replaces.some((id) => byId.get(id)!.status === "picked") ? ("picked" as const) : ("new" as const),
          editedBy: actor,
          updatedAt: nowIso(),
        },
      };
    });
    const superseded = rows.flatMap((r) => r.replaces);
    await db
      .delete(narratives)
      .where(and(eq(narratives.ownerEmail, owner), eq(narratives.scanId, args.scanId), eq(narratives.editedBy, "agent"), ne(narratives.status, "picked")));
    await db.insert(narratives).values(rows.map((r) => r.row));
    for (const { replaces, row } of rows) {
      if (!replaces.length) continue;
      await db.update(sources).set({ narrativeId: row.id }).where(and(eq(sources.ownerEmail, owner), inArray(sources.narrativeId, replaces)));
      await db.update(briefs).set({ narrativeId: row.id }).where(and(eq(briefs.ownerEmail, owner), inArray(briefs.narrativeId, replaces)));
    }
    if (superseded.length) await db.delete(narratives).where(and(eq(narratives.ownerEmail, owner), inArray(narratives.id, superseded)));
    const kept = board.narratives.filter((n) => n.status === "picked" && !superseded.includes(n.id)).map((n) => ({ id: n.id, title: n.title }));
    return { saved: rows.length, ids: rows.map((r) => r.row.id), keptPicked: kept };
  },
});
