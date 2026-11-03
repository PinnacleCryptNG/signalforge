import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { getCalendar } from "../server/lib/calendar.js";
import { requireOwner } from "../server/lib/owner.js";

export default defineAction({
  description:
    "Read the publishing calendar: drafts scheduled between from and to (ISO datetimes, defaults to the next 14 days) and approved drafts still waiting for a slot (ready). Times are UTC ISO; convert with the user's timezone from <current-screen>.",
  schema: z.object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async (args, ctx) => {
    const from = args.from ? new Date(args.from) : new Date(Date.now() - 86_400_000);
    const to = args.to ? new Date(args.to) : new Date(from.getTime() + 15 * 86_400_000);
    return getCalendar(requireOwner(ctx), from.toISOString(), to.toISOString());
  },
});
