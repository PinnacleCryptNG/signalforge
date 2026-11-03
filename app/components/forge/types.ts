import type { Narrative, Signal, Stage } from "../signals/format";

export type SourceStatus = "pending" | "approved" | "rejected";

export type Source = {
  id: string;
  narrativeId: string;
  url: string;
  title: string;
  publisher: string;
  excerpt: string;
  publishedAt: string | null;
  status: SourceStatus;
  decidedBy: "user" | "agent";
  addedBy: "user" | "agent";
  recommendation: "" | "approve" | "reject";
  note: string;
  updatedAt: string;
};

export type KeyPoint = { point: string; sourceIds: string[] };

export type Brief = {
  id: string;
  narrativeId: string;
  angle: string;
  audience: string;
  keyPoints: KeyPoint[];
  tone: string;
  cta: string;
  sourceIds: string[];
  editedBy: "user" | "agent";
  updatedAt: string;
  unapprovedCitations: string[];
};

export type QueueItem = { id: string; title: string; stage: Stage; momentum: number; sources: number; approved: number; hasBrief: boolean };

export type Forge = {
  queue: QueueItem[];
  selected: {
    narrative: Narrative;
    niche: string;
    region: string;
    evidence: Signal[];
    sources: Source[];
    brief: Brief | null;
  } | null;
};
