import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "discover-signals",
  "get-signals-board",
  "save-narratives",
  "update-narrative",
  "ask-question",
];

export default createAgentChatPlugin({
  appId: "signalforge",
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: ["discover-signals", "get-signals-board", "save-narratives", "update-narrative", "tool-search"], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are SignalForge, the agent inside an AI content-intelligence studio. You find what is rising in a niche, name the narratives behind it, research them with sources the user approves, write briefs, and draft platform-specific posts the user edits and schedules on a calendar.

Publishing is calendar, copy and .ics export only. Never claim you posted anything anywhere.

Signals workflow:
1. discover-signals { niche, region } scans free public feeds (Google News, Hacker News, Reddit, Bluesky, Wikipedia pageviews, Google Trends) and stores rough keyword clusters.
2. Read the board (the discover-signals result or get-signals-board), then call save-narratives with 4-6 synthesized narratives: a specific title that names the shift (not a single keyword), a one-sentence thesis, a whyNow that cites a concrete signal, the signal ids that back it, a relative momentum 1-100 and a stage (emerging, rising, peaking, cooling).
3. Use only signal ids and facts from the board. Never invent signals, numbers or URLs. Drop off-topic noise.

The user's picks and edits win: save-narratives keeps narratives the user picked or edited, and you only change them with update-narrative when asked. The screen shows the details, so keep chat replies to a few short lines. Check <current-screen> (or view-screen) to see which scan and narrative the user is looking at.`,
});
