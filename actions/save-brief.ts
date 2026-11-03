import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { briefs } from "../server/db/schema.js";
import { getBrief, listSources } from "../server/lib/forge.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getNarrative, newId, nowIso } from "../server/lib/store.js";

const keyPoint = z.object({
  point: z.string().min(3).max(400),
  sourceIds: z.array(z.string()).default([]).describe("Approved source ids that back this point"),
});

export default defineAction({
  description:
    "Create or update the content brief for a narrative: angle, audience, key points (each citing approved source ids), tone and call to action. Every cited source must be approved by the user; unapproved ids are rejected. Omitted fields keep their current value.",
  schema: z.object({
    narrativeId: z.string(),
    angle: z.string().min(3).max(500).optional().describe("The one-line take this campaign argues"),
    audience: z.string().max(300).optional(),
    keyPoints: z.array(keyPoint).min(1).max(8).optional(),
    tone: z.string().max(200).optional(),
    cta: z.string().max(300).optional(),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCaller(ctx?.caller);
    await getNarrative(owner, args.narrativeId);
    const existing = await getBrief(owner, args.narrativeId);
    const approved = new Set((await listSources(owner, args.narrativeId)).filter((s) => s.status === "approved").map((s) => s.id));
    if (!approved.size) fail("Approve at least one source before writing the brief.", { errorCode: "no_approved_sources", statusCode: 409 });

    if (args.keyPoints) {
      const bad = [...new Set(args.keyPoints.flatMap((k) => k.sourceIds).filter((id) => !approved.has(id)))];
      if (bad.length) fail(`These sources are not approved: ${bad.join(", ")}. Cite only approved sources.`, { errorCode: "unapproved_source", statusCode: 409 });
    }
    const keyPoints = args.keyPoints ?? existing?.keyPoints;
    const angle = args.angle ?? existing?.angle;
    if (!angle || !keyPoints?.length) fail("A new brief needs an angle and at least one key point.", { errorCode: "incomplete_brief", statusCode: 400 });

    const row = {
      angle: angle!,
      audience: args.audience ?? existing?.audience ?? "",
      keyPoints: JSON.stringify(keyPoints),
      tone: args.tone ?? existing?.tone ?? "",
      cta: args.cta ?? existing?.cta ?? "",
      sourceIds: JSON.stringify([...new Set(keyPoints!.flatMap((k) => k.sourceIds))]),
      editedBy: actor,
      updatedAt: nowIso(),
    };
    const db = getDb();
    if (existing) await db.update(briefs).set(row).where(and(eq(briefs.ownerEmail, owner), eq(briefs.id, existing.id)));
    else await db.insert(briefs).values({ id: newId("brf"), ownerEmail: owner, narrativeId: args.narrativeId, ...row });
    return { brief: await getBrief(owner, args.narrativeId) };
  },
});
