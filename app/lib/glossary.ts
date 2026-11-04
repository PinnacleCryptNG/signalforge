/** Plain meanings for the few SignalForge words a newcomer won't know. */
export const GLOSSARY = {
  signals: { word: "Signals", short: "Find trends", text: "Signals are the stories people are talking about right now in your topic, pulled from 6 free news and social sites." },
  forge: { word: "Forge", short: "Write posts", text: "The Forge is your workshop. A story you pick lands here, gets its facts checked, and turns into finished posts you can edit." },
  autopilot: { word: "Autopilot", short: "AI does it all", text: "Autopilot means the AI does the whole job: it finds the facts, plans the posts and writes all 5. You just read and approve them." },
  stepbystep: { word: "Step by step", short: "You check each fact", text: "Step by step means you stay in charge of each stage: you approve every article before the AI writes anything." },
  sources: { word: "Sources", short: "Articles used as proof", text: "Sources are the articles a post is based on. Only the ones you (or Autopilot) approve are used, so every claim can be traced back." },
  brief: { word: "Plan", short: "What every post follows", text: "The plan is a short outline: the main point, who it's for, the tone, and the key facts. Every post is written from it." },
  calendar: { word: "Calendar", short: "Plan when to post", text: "The Calendar is your posting plan. SignalForge never posts for you: copy each post when it's time, or add them to Google or Apple Calendar." },
  agent: { word: "AI helper", short: "Ask in plain words", text: "Your AI helper does the work when you ask, like “write posts about this story” or “make my LinkedIn post shorter”." },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
