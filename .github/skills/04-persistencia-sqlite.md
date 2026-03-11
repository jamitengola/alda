# Skill 04 — Persistência com SQLite Local

## Problema
Todos os dados ficam em memória e perdem-se ao reiniciar o servidor.

## Objetivo
Usar SQLite local para persistir resumos, tarefas, follow-ups e base de conhecimento.

## Stack
- `better-sqlite3` (síncrono, rápido, zero config)
- Ficheiro DB em `data/alda.db` (gitignored)

## Schema

```sql
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
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Implementação
1. `src/lib/db.ts` — singleton de conexão + init de tabelas
2. Cada rota API usa db em vez de array em memória
3. Knowledge store migra de `knowledgeItems[]` para queries SQL
4. Adicionar `data/` ao `.gitignore`

## Regras
- Nunca expor o ficheiro DB no browser
- Queries parametrizadas sempre (prevenir injection)
- Migração automática no startup (CREATE IF NOT EXISTS)
