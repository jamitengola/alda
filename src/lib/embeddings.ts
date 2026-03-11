/**
 * Embedding utilities for RAG — uses Ollama's nomic-embed-text model locally.
 * Falls back to a simple TF-like approach if Ollama is unreachable.
 */

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";

/**
 * Generate an embedding vector for the given text using Ollama.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    });

    if (!res.ok) {
      console.warn(`Ollama embeddings returned ${res.status}, using fallback`);
      return fallbackEmbedding(text);
    }

    const data = (await res.json()) as { embedding: number[] };
    return data.embedding;
  } catch (err) {
    console.warn("Ollama embeddings unavailable, using fallback:", err);
    return fallbackEmbedding(text);
  }
}

/**
 * Cosine similarity between two vectors of equal length.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Find the top-K most similar items from a list of embedded items.
 */
export function findTopK<T extends { embedding?: string | null }>(
  queryEmbedding: number[],
  items: T[],
  k: number = 5
): (T & { score: number })[] {
  return items
    .map((item) => {
      const emb = item.embedding ? (JSON.parse(item.embedding) as number[]) : null;
      const score = emb ? cosineSimilarity(queryEmbedding, emb) : 0;
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Simple bag-of-words fallback when Ollama is not available.
 * Produces a 256-dimensional hash-based vector (not real embeddings, but better than substring).
 */
function fallbackEmbedding(text: string): number[] {
  const dim = 256;
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\W+/);
  for (const word of words) {
    if (!word) continue;
    // Simple hash to distribute words across dimensions
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff;
    }
    vec[hash % dim] += 1;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }
  return vec;
}
