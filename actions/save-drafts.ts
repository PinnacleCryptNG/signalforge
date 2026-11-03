import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../server/db/index.js";
import { drafts, PLATFORMS } from "../server/db/schema.js";
import { limitProblem, listDrafts, PLATFORM_SPECS } from "../server/lib/drafts.js";
import { getBrief } from "../server/lib/forge.js";
import { requireOwner } from "../server/lib/owner.js";
import { actorFromCaller, getNarrative, newId, nowIso } from "../server/lib/store.js";

export default defineAction({
  description: `Write platform drafts for a narrative from its brief (one draft per platform; saving a platform again replaces it). Use only the brief's angle, key points and approved sources; never add facts. Drafts the user edited are kept unless overwriteEdited is true (only when the user asks to replace them). Platform rules: ${PLATFORMS.map((p) => `${p}: ${PLATFORM_SPECS[p].guide}`).join(" ")}`,
  schema: z.object({
    narrativeId: z.string(),
    drafts: z
      .array(
        z.object({
          platform: z.enum(PLATFORMS),
          title: z.string().max(160).optional().describe("Subject line (newsletter) or video title; leave empty for social posts"),
          body: z.string().min(10).max(8000),
        }),
      )
      .min(1)
      .max(5),
    overwriteEdited: z.boolean().default(false),
  }),
  http: { method: "POST" },
  run: async (args, ctx) => {
    const owner = requireOwner(ctx);
    const actor = actorFromCaller(ctx?.caller);
    await getNarrative(owner, args.narrativeId);
    const brief = await getBrief(owner, args.narrativeId);
    if (!brief) fail("Write the brief before drafting. Drafts follow the brief.", { errorCode: "no_brief", statusCode: 409 });

    const checked = args.drafts.map((d) => ({
      d,
      problem: limitProblem(d.platform, d.body) ?? (PLATFORM_SPECS[d.platform].needsTitle && !d.title?.trim() ? `${PLATFORM_SPECS[d.platform].label} needs a title.` : null),
    }));
    const needsFix = checked.filter((c) => c.problem).map((c) => ({ platform: c.d.platform, problem: c.problem! }));
    if (needsFix.length === checked.length) fail(`${needsFix.map((n) => n.problem).join(" ")} Nothing was saved; fix and call save-drafts again.`, { errorCode: "over_limit", statusCode: 400 });

    const existing = new Map((await listDrafts(owner, args.narrativeId)).map((d) => [d.platform, d]));
    const db = getDb();
    const saved: string[] = [];
    const keptEdited: string[] = [];
    for (const { d } of checked.filter((c) => !c.problem)) {
      const prev = existing.get(d.platform);
      if (prev?.editedBy === "user" && actor === "agent" && !args.overwriteEdited) {
        keptEdited.push(d.platform);
        continue;
      }
      const row = { briefId: brief!.id, title: d.title?.trim() ?? "", body: d.body.trim(), status: "draft" as const, editedBy: actor, updatedAt: nowIso() };
      if (prev) await db.update(drafts).set(row).where(and(eq(drafts.ownerEmail, owner), eq(drafts.id, prev.id)));
      else await db.insert(drafts).values({ id: newId("drf"), ownerEmail: owner, narrativeId: args.narrativeId, platform: d.platform, ...row });
      saved.push(d.platform);
    }
    return {
      saved,
      keptEdited,
      needsFix,
      ...(needsFix.length ? { next: "Some drafts broke platform rules and were not saved. Fix them and call save-drafts again with just those platforms." } : {}),
      drafts: await listDrafts(owner, args.narrativeId),
    };
  },
});
