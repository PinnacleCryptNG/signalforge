import { runMigrations } from "@agent-native/core/db";

const ts = "updated_at TEXT NOT NULL DEFAULT now()";

export default runMigrations(
  [
    {
      version: 1,
      name: "sf-scans",
      sql: `CREATE TABLE IF NOT EXISTS scans (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        niche TEXT NOT NULL,
        region TEXT NOT NULL DEFAULT 'US',
        feed_stats TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT now()
      )`,
    },
    {
      version: 2,
      name: "sf-signals",
      sql: `CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        scan_id TEXT NOT NULL,
        feed TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        snippet TEXT NOT NULL DEFAULT '',
        publisher TEXT NOT NULL DEFAULT '',
        published_at TEXT,
        engagement INTEGER NOT NULL DEFAULT 0,
        score INTEGER NOT NULL DEFAULT 0
      )`,
    },
    {
      version: 3,
      name: "sf-narratives",
      sql: `CREATE TABLE IF NOT EXISTS narratives (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        scan_id TEXT NOT NULL,
        title TEXT NOT NULL,
        thesis TEXT NOT NULL DEFAULT '',
        why_now TEXT NOT NULL DEFAULT '',
        keywords TEXT NOT NULL DEFAULT '[]',
        signal_ids TEXT NOT NULL DEFAULT '[]',
        momentum INTEGER NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'emerging',
        status TEXT NOT NULL DEFAULT 'new',
        edited_by TEXT NOT NULL DEFAULT 'agent',
        ${ts}
      )`,
    },
    {
      version: 4,
      name: "sf-sources",
      sql: `CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        narrative_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        publisher TEXT NOT NULL DEFAULT '',
        excerpt TEXT NOT NULL DEFAULT '',
        published_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        decided_by TEXT NOT NULL DEFAULT 'agent',
        added_by TEXT NOT NULL DEFAULT 'agent',
        ${ts}
      )`,
    },
    {
      version: 5,
      name: "sf-briefs",
      sql: `CREATE TABLE IF NOT EXISTS briefs (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        narrative_id TEXT NOT NULL,
        angle TEXT NOT NULL,
        audience TEXT NOT NULL DEFAULT '',
        key_points TEXT NOT NULL DEFAULT '[]',
        tone TEXT NOT NULL DEFAULT '',
        cta TEXT NOT NULL DEFAULT '',
        source_ids TEXT NOT NULL DEFAULT '[]',
        edited_by TEXT NOT NULL DEFAULT 'agent',
        ${ts}
      )`,
    },
    {
      version: 6,
      name: "sf-drafts",
      sql: `CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        brief_id TEXT NOT NULL,
        narrative_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        scheduled_for TEXT,
        edited_by TEXT NOT NULL DEFAULT 'agent',
        ${ts}
      )`,
    },
    {
      version: 7,
      name: "sf-signals_owner_scan_idx",
      sql: `CREATE INDEX IF NOT EXISTS signals_owner_scan_idx ON signals (owner_email, scan_id)`,
    },
    {
      version: 8,
      name: "sf-narratives_owner_scan_idx",
      sql: `CREATE INDEX IF NOT EXISTS narratives_owner_scan_idx ON narratives (owner_email, scan_id)`,
    },
    {
      version: 9,
      name: "sf-sources_owner_narr_idx",
      sql: `CREATE INDEX IF NOT EXISTS sources_owner_narr_idx ON sources (owner_email, narrative_id)`,
    },
    {
      version: 10,
      name: "sf-drafts_owner_sched_idx",
      sql: `CREATE INDEX IF NOT EXISTS drafts_owner_sched_idx ON drafts (owner_email, scheduled_for)`,
    },
  ],
  { table: "signalforge_migrations" },
);
