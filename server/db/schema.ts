import { sql } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const FEEDS = ["hackernews", "reddit", "news", "trends", "wikipedia", "bluesky"] as const;
export const STAGES = ["emerging", "rising", "peaking", "cooling"] as const;
export const NARRATIVE_STATUSES = ["new", "picked", "dismissed"] as const;
export const SOURCE_STATUSES = ["pending", "approved", "rejected"] as const;
export const PLATFORMS = ["x", "linkedin", "instagram", "newsletter", "video"] as const;
export const DRAFT_STATUSES = ["draft", "approved", "scheduled", "published"] as const;
export const ACTORS = ["user", "agent"] as const;

export type Feed = (typeof FEEDS)[number];
export type Stage = (typeof STAGES)[number];
export type NarrativeStatus = (typeof NARRATIVE_STATUSES)[number];
export type SourceStatus = (typeof SOURCE_STATUSES)[number];
export type Platform = (typeof PLATFORMS)[number];
export type DraftStatus = (typeof DRAFT_STATUSES)[number];
export type Actor = (typeof ACTORS)[number];

const now = () => text("updated_at").notNull().default(sql`now()`);

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  niche: text("niche").notNull(),
  region: text("region").notNull().default("US"),
  feedStats: text("feed_stats").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const signals = pgTable("signals", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  scanId: text("scan_id").notNull(),
  feed: text("feed", { enum: FEEDS }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  snippet: text("snippet").notNull().default(""),
  publisher: text("publisher").notNull().default(""),
  publishedAt: text("published_at"),
  engagement: integer("engagement").notNull().default(0),
  score: integer("score").notNull().default(0),
});

export const narratives = pgTable("narratives", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  scanId: text("scan_id").notNull(),
  title: text("title").notNull(),
  thesis: text("thesis").notNull().default(""),
  whyNow: text("why_now").notNull().default(""),
  keywords: text("keywords").notNull().default("[]"),
  signalIds: text("signal_ids").notNull().default("[]"),
  momentum: integer("momentum").notNull().default(0),
  stage: text("stage", { enum: STAGES }).notNull().default("emerging"),
  status: text("status", { enum: NARRATIVE_STATUSES }).notNull().default("new"),
  editedBy: text("edited_by", { enum: ACTORS }).notNull().default("agent"),
  updatedAt: now(),
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  narrativeId: text("narrative_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  publisher: text("publisher").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  publishedAt: text("published_at"),
  status: text("status", { enum: SOURCE_STATUSES }).notNull().default("pending"),
  decidedBy: text("decided_by", { enum: ACTORS }).notNull().default("agent"),
  addedBy: text("added_by", { enum: ACTORS }).notNull().default("agent"),
  updatedAt: now(),
});

export const briefs = pgTable("briefs", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  narrativeId: text("narrative_id").notNull(),
  angle: text("angle").notNull(),
  audience: text("audience").notNull().default(""),
  keyPoints: text("key_points").notNull().default("[]"),
  tone: text("tone").notNull().default(""),
  cta: text("cta").notNull().default(""),
  sourceIds: text("source_ids").notNull().default("[]"),
  editedBy: text("edited_by", { enum: ACTORS }).notNull().default("agent"),
  updatedAt: now(),
});

export const drafts = pgTable("drafts", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  briefId: text("brief_id").notNull(),
  narrativeId: text("narrative_id").notNull(),
  platform: text("platform", { enum: PLATFORMS }).notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull(),
  status: text("status", { enum: DRAFT_STATUSES }).notNull().default("draft"),
  scheduledFor: text("scheduled_for"),
  editedBy: text("edited_by", { enum: ACTORS }).notNull().default("agent"),
  updatedAt: now(),
});

export type ScanRow = typeof scans.$inferSelect;
export type SignalRow = typeof signals.$inferSelect;
export type NarrativeRow = typeof narratives.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type BriefRow = typeof briefs.$inferSelect;
export type DraftRow = typeof drafts.$inferSelect;
