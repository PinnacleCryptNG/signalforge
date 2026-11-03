import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { buildIcs, getCalendar } from "../server/lib/calendar.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description:
    "Export scheduled posts as an .ics calendar file (each post is a 30-minute event with the full copy and a 10-minute reminder). Defaults to everything from 30 days ago to 90 days ahead. Returns the file text; the UI downloads it.",
  schema: z.object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async (args, ctx) => {
    const from = args.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
    const to = args.to ?? new Date(Date.now() + 90 * 86_400_000).toISOString();
    const { scheduled } = await getCalendar(requireOwner(ctx), new Date(from).toISOString(), new Date(to).toISOString());
    return { filename: "signalforge-calendar.ics", events: scheduled.length, ics: buildIcs(scheduled) };
  },
});
