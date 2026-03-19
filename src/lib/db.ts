import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "alda.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Auto-migrate tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      summary TEXT NOT NULL,
      provider TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY,
      objective TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      priority TEXT CHECK(priority IN ('alta','média','baixa')),
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS followups (
      id TEXT PRIMARY KEY,
      context TEXT NOT NULL,
      followup TEXT NOT NULL,
      provider TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coaching_sessions (
      id TEXT PRIMARY KEY,
      duration INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      suggestions_used INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'coaching',
      topic TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: add embedding column if it doesn't exist (for existing DBs)
  try {
    _db.exec(`ALTER TABLE knowledge ADD COLUMN embedding TEXT`);
  } catch {
    // Column already exists — ignore
  }

  return _db;
}

// ─── Summaries ───────────────────────────────────────────

export function saveSummary(transcript: string, summary: string, provider: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO summaries (id, transcript, summary, provider) VALUES (?, ?, ?, ?)`
  ).run(id, transcript, summary, provider);
  return id;
}

export function listSummaries(limit = 20) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM summaries ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

// ─── Study Tasks ─────────────────────────────────────────

export function saveStudyTasks(
  objective: string,
  tasks: { title: string; dueDate?: string; priority?: string }[]
) {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO study_tasks (id, objective, title, due_date, priority) VALUES (?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction(
    (items: { title: string; dueDate?: string; priority?: string }[]) => {
      for (const t of items) {
        insert.run(
          crypto.randomUUID(),
          objective,
          t.title,
          t.dueDate ?? null,
          t.priority ?? "média"
        );
      }
    }
  );

  insertMany(tasks);
}

export function listStudyTasks(limit = 50) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM study_tasks ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

export function toggleStudyTask(id: string, completed: boolean) {
  const db = getDb();
  db.prepare(`UPDATE study_tasks SET completed = ? WHERE id = ?`).run(
    completed ? 1 : 0,
    id
  );
}

// ─── Follow-ups ──────────────────────────────────────────

export function saveFollowup(context: string, followup: string, provider: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO followups (id, context, followup, provider) VALUES (?, ?, ?, ?)`
  ).run(id, context, followup, provider);
  return id;
}

export function listFollowups(limit = 20) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM followups ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

// ─── Knowledge ───────────────────────────────────────────

export function addKnowledgeItem(source: string, content: string, embedding?: number[]) {
  const db = getDb();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const embeddingJson = embedding ? JSON.stringify(embedding) : null;
  db.prepare(
    `INSERT INTO knowledge (id, source, content, embedding, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, source, content, embeddingJson, createdAt);
  return { id, source, content, createdAt };
}

export function listKnowledgeItems() {
  const db = getDb();
  return db
    .prepare(`SELECT id, source, content, created_at FROM knowledge ORDER BY created_at DESC`)
    .all() as { id: string; source: string; content: string; created_at: string }[];
}

export function listKnowledgeItemsWithEmbeddings() {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM knowledge ORDER BY created_at DESC`)
    .all() as { id: string; source: string; content: string; embedding: string | null; created_at: string }[];
}

export function queryKnowledgeDb(query: string) {
  const db = getDb();
  const pattern = `%${query}%`;
  return db
    .prepare(
      `SELECT id, source, content, created_at FROM knowledge WHERE source LIKE ? OR content LIKE ? ORDER BY created_at DESC LIMIT 5`
    )
    .all(pattern, pattern) as {
    id: string;
    source: string;
    content: string;
    created_at: string;
  }[];
}

// ─── Coaching Sessions (Performance) ─────────────────────

export function saveCoachingSession(
  duration: number,
  wordCount: number,
  suggestionsUsed: number,
  mode: string,
  topic: string
) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO coaching_sessions (id, duration, word_count, suggestions_used, mode, topic) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, duration, wordCount, suggestionsUsed, mode, topic);
  return id;
}

export function listCoachingSessions(limit = 30) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM coaching_sessions ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as {
    id: string;
    duration: number;
    word_count: number;
    suggestions_used: number;
    mode: string;
    topic: string;
    created_at: string;
  }[];
}

export function getCoachingStats() {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration), 0) as total_duration,
        COALESCE(SUM(word_count), 0) as total_words,
        COALESCE(SUM(suggestions_used), 0) as total_suggestions,
        COALESCE(AVG(duration), 0) as avg_duration,
        COALESCE(AVG(word_count), 0) as avg_words
      FROM coaching_sessions`
    )
    .get() as {
    total_sessions: number;
    total_duration: number;
    total_words: number;
    total_suggestions: number;
    avg_duration: number;
    avg_words: number;
  };
  return row;
}

// ─── Dashboard Analytics ─────────────────────────────────

export function getDashboardStats() {
  const db = getDb();

  const counts = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM summaries) as transcriptions,
        (SELECT COUNT(*) FROM coaching_sessions) as coaching,
        (SELECT COUNT(*) FROM followups) as followups,
        (SELECT COUNT(*) FROM knowledge) as knowledge,
        (SELECT COUNT(*) FROM study_tasks) as study_tasks,
        (SELECT COUNT(*) FROM study_tasks WHERE completed = 1) as study_completed,
        (SELECT COALESCE(SUM(duration), 0) FROM coaching_sessions) as total_coaching_time`
    )
    .get() as {
    transcriptions: number;
    coaching: number;
    followups: number;
    knowledge: number;
    study_tasks: number;
    study_completed: number;
    total_coaching_time: number;
  };

  // Daily activity for the last 7 days
  const dailyActivity = db
    .prepare(
      `SELECT date, SUM(cnt) as total FROM (
        SELECT date(created_at) as date, COUNT(*) as cnt FROM summaries
          WHERE created_at >= datetime('now', '-7 days') GROUP BY date(created_at)
        UNION ALL
        SELECT date(created_at) as date, COUNT(*) as cnt FROM coaching_sessions
          WHERE created_at >= datetime('now', '-7 days') GROUP BY date(created_at)
        UNION ALL
        SELECT date(created_at) as date, COUNT(*) as cnt FROM followups
          WHERE created_at >= datetime('now', '-7 days') GROUP BY date(created_at)
      ) GROUP BY date ORDER BY date`
    )
    .all() as { date: string; total: number }[];

  return { counts, dailyActivity };
}

// ─── Unified History Timeline ────────────────────────────

export type TimelineItem = {
  id: string;
  type: "coaching" | "transcription" | "followup";
  title: string;
  preview: string;
  meta: string;
  created_at: string;
};

export function getTimeline(search?: string, limit = 50): TimelineItem[] {
  const db = getDb();
  const q = search ? `%${search}%` : null;

  const coaching = db
    .prepare(
      q
        ? `SELECT id, 'coaching' as type, COALESCE(topic,'Sessão') as title, mode, duration, word_count, created_at FROM coaching_sessions WHERE topic LIKE ? OR mode LIKE ? ORDER BY created_at DESC LIMIT ?`
        : `SELECT id, 'coaching' as type, COALESCE(topic,'Sessão') as title, mode, duration, word_count, created_at FROM coaching_sessions ORDER BY created_at DESC LIMIT ?`
    )
    .all(...(q ? [q, q, limit] : [limit])) as {
    id: string;
    type: "coaching";
    title: string;
    mode: string;
    duration: number;
    word_count: number;
    created_at: string;
  }[];

  const transcriptions = db
    .prepare(
      q
        ? `SELECT id, 'transcription' as type, summary, transcript, created_at FROM summaries WHERE summary LIKE ? OR transcript LIKE ? ORDER BY created_at DESC LIMIT ?`
        : `SELECT id, 'transcription' as type, summary, transcript, created_at FROM summaries ORDER BY created_at DESC LIMIT ?`
    )
    .all(...(q ? [q, q, limit] : [limit])) as {
    id: string;
    type: "transcription";
    summary: string;
    transcript: string;
    created_at: string;
  }[];

  const followups = db
    .prepare(
      q
        ? `SELECT id, 'followup' as type, context, followup, created_at FROM followups WHERE context LIKE ? OR followup LIKE ? ORDER BY created_at DESC LIMIT ?`
        : `SELECT id, 'followup' as type, context, followup, created_at FROM followups ORDER BY created_at DESC LIMIT ?`
    )
    .all(...(q ? [q, q, limit] : [limit])) as {
    id: string;
    type: "followup";
    context: string;
    followup: string;
    created_at: string;
  }[];

  const items: TimelineItem[] = [
    ...coaching.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title || "Sessão de coaching",
      preview: `Modo: ${c.mode} · ${c.word_count} palavras`,
      meta: `${Math.floor(c.duration / 60)}min`,
      created_at: c.created_at,
    })),
    ...transcriptions.map((t) => ({
      id: t.id,
      type: t.type,
      title: t.summary.slice(0, 80) + (t.summary.length > 80 ? "..." : ""),
      preview: t.transcript.slice(0, 120) + (t.transcript.length > 120 ? "..." : ""),
      meta: "",
      created_at: t.created_at,
    })),
    ...followups.map((f) => ({
      id: f.id,
      type: f.type,
      title: "Follow-up",
      preview: f.context.slice(0, 120) + (f.context.length > 120 ? "..." : ""),
      meta: "",
      created_at: f.created_at,
    })),
  ];

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items.slice(0, limit);
}

export function getTimelineItem(id: string, type: string) {
  const db = getDb();
  if (type === "coaching") {
    return db.prepare(`SELECT * FROM coaching_sessions WHERE id = ?`).get(id);
  } else if (type === "transcription") {
    return db.prepare(`SELECT * FROM summaries WHERE id = ?`).get(id);
  } else if (type === "followup") {
    return db.prepare(`SELECT * FROM followups WHERE id = ?`).get(id);
  }
  return null;
}
