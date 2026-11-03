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

export type QueueItem = { id: string; title: string; stage: Stage; momentum: number; sources: number; approved: number; hasBrief: boolean; drafts: number };

export type Forge = {
  queue: QueueItem[];
  selected: {
    narrative: Narrative;
    niche: string;
    region: string;
    evidence: Signal[];
    sources: Source[];
    brief: Brief | null;
    drafts: Draft[];
  } | null;
};

export type Platform = "x" | "linkedin" | "instagram" | "newsletter" | "video";

export type Draft = {
  id: string;
  narrativeId: string;
  briefId: string;
  platform: Platform;
  title: string;
  body: string;
  status: "draft" | "approved" | "scheduled" | "published";
  scheduledFor: string | null;
  editedBy: "user" | "agent";
  updatedAt: string;
};
