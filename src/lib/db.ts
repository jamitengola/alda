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
