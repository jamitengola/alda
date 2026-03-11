# Skill 08 — RAG Melhorado com Embeddings

## Problema
A busca na base de conhecimento é por substring (includes) — não semântica.

## Objetivo
Usar embeddings locais para busca semântica real.

## Abordagem

### Opção A — Embeddings via Ollama (recomendado)
```bash
ollama pull nomic-embed-text
```
- Endpoint: `POST /api/embeddings` com `{ model: "nomic-embed-text", prompt: "..." }`
- Retorna vetor de 768 dimensões
- Armazenar vetores no SQLite (como JSON ou BLOB)
- Similaridade por cosine distance calculada em JS

### Fluxo
1. Ao adicionar conhecimento → gerar embedding → salvar no DB
2. Ao consultar → gerar embedding da query → calcular cosine similarity com todos os itens
3. Retornar top-K mais similares como contexto para o LLM

### Schema adicional
```sql
ALTER TABLE knowledge ADD COLUMN embedding TEXT; -- JSON array of floats
```

### Cosine similarity em JS
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### Prioridade
- Fase 1: embeddings + cosine search (funcional)
- Fase 2: índice vetorial mais eficiente se base crescer muito
