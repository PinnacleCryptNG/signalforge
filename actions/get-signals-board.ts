import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { requireOwner } from "../server/lib/owner.js";
import { getBoard } from "../server/lib/store.js";

export default defineAction({
  description: "Read the Signals board: the latest scan (or a given scanId), its narratives sorted by momentum, and every signal behind them.",
  schema: z.object({ scanId: z.string().optional().describe("Scan id; defaults to the latest scan") }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ scanId }, ctx) => getBoard(requireOwner(ctx), scanId),
});
