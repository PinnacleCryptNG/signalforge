# SignalForge — AI Content Intelligence Studio

SignalForge finds the stories starting to rise in your niche, checks them against sources you approve, and turns them into a ready-to-post campaign on a calendar. The agent does the research and writing. You decide which sources count, what gets published and when.

**Live app:** https://signalforge-agent.vercel.app

Built with [Agent-Native](https://www.agent-native.com) for the [Builder.io hackathon](https://www.builder.io/hackathon). The agent runs on the Builder.io gateway, so it needs no other model or search API keys.

## The flow

1. **Signals.** Type a niche (for example "fintech in Africa") and pick a region. SignalForge scans six free, keyless feeds: Google News, Hacker News, Reddit, Bluesky, Wikipedia pageviews and Google Trends. It groups what it finds into emerging narratives, each with a momentum score, a stage and the evidence behind it. If a feed is down, the scan still finishes and shows that feed as off. "Sharpen with agent" rewrites the clusters into tighter narratives, citing only real signals.
2. **Forge.** Pick a narrative.
   - **Sources:** "Quick research" pulls source candidates from the free feeds in a few seconds. "Research with agent" also reads each excerpt and recommends approve or reject, with a reason. A recommendation stays pending until you approve or reject the source yourself, one at a time or in bulk.
   - **Brief:** locked until at least one source is approved. The server rejects a brief that cites a source you haven't approved. Every field can be edited in place.
   - **Drafts:** written from the brief for X, LinkedIn, Instagram, a newsletter and a short-video script. The server enforces each platform's limits (280 characters per X post, up to 6 posts in a thread) and reports exact counts so the agent can shorten and retry. You can edit inline, use one-tap rewrites (Punchier, Shorter, More personal, More authoritative, Stronger hook) or give your own instruction. Drafts you edited are kept when the agent redrafts. Only you can approve a draft.
3. **Calendar.** Approved drafts wait under "Ready to schedule". You can drag a draft onto a day, or on a phone tap the draft and then the day. You can move posts, mark them published, copy them or take them off the calendar. Two posts on the same platform must be at least 60 minutes apart, and a clash is refused with a clear message. "Export .ics" downloads every post, with its full text and a 10-minute reminder, for Google Calendar or Apple Calendar.

SignalForge never posts anywhere for you. "Published" means you posted the content yourself.

## Agent-native by design

Every capability is a single action that the UI, the agent sidebar and MCP clients all call. You can click through the whole flow, or ask the agent something like "forge an X and LinkedIn campaign on the top narrative and put it on Friday" and watch the same screens update.

| Action | What it does |
| --- | --- |
| `discover-signals` | Scan the free feeds for a niche and group signals into narratives |
| `get-signals-board` | Read the signals and narratives |
| `save-narratives`, `update-narrative` | Save sharpened narratives; rename, pick or dismiss one |
| `research-narrative`, `add-source` | Gather source candidates with stored excerpts |
| `review-source` | Approve or reject many sources at once. When the agent calls it, it only records a recommendation. |
| `get-forge`, `save-brief` | Read the forge; save a brief that may cite approved sources only |
| `save-drafts`, `update-draft` | Write, edit, rewrite or approve platform drafts (limits checked on the server) |
| `get-calendar`, `schedule-draft`, `export-ics` | Schedule, move, unschedule or mark published; export to .ics |

## Human control, enforced on the server

- When the agent reviews a source it only records a recommendation. Only the signed-in user can set a source to approved or rejected.
- A brief can only cite approved source IDs.
- Only the user can approve a draft, and a draft over its platform limit can't be approved.
- Only approved drafts can be scheduled. Same-platform clashes are refused.
- All data is stored in SQL per owner, and every query is scoped to the signed-in account.

## Stack

- Agent-Native (`@agent-native/core`), React Router, React 19, Tailwind
- Builder.io gateway for the agent model ("Use Builder.io" in settings)
- Postgres (Neon, through Vercel) using Drizzle migrations
- Deployed on Vercel

## Run it locally

```bash
pnpm install
pnpm dev            # http://localhost:8080
```

Sign up, then open **Settings → Integrations → Builder.io** and tap **Use Builder.io** to enable the agent. Scanning, quick research, editing and the calendar work without it.

Checks:

```bash
pnpm typecheck
pnpm agent-native:doctor
```
