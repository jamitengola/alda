import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import {
  addKnowledgeItem,
  listKnowledgeItems,
  listKnowledgeItemsWithEmbeddings,
} from "@/lib/db";
import { generateEmbedding, findTopK } from "@/lib/embeddings";

type AddPayload = {
  action: "add";
  source?: string;
  content?: string;
};

type QueryPayload = {
  action: "query";
  query?: string;
};

type Payload = AddPayload | QueryPayload;

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Payload;

  const formatItems = () =>
    listKnowledgeItems().map((i) => ({
      id: i.id,
      source: i.source,
      content: i.content,
      createdAt: i.created_at,
    }));

  if (payload.action === "add") {
    const source = payload.source?.trim() ?? "";
    const content = payload.content?.trim() ?? "";

    if (!source || !content) {
      return NextResponse.json({
        answer: "Preencha fonte e conteúdo para adicionar conhecimento.",
        items: formatItems(),
      });
    }

    // Generate embedding for the new knowledge item
    const embedding = await generateEmbedding(`${source}: ${content}`);
    addKnowledgeItem(source, content, embedding);

    return NextResponse.json({
      answer: "Conhecimento adicionado com sucesso (com embedding).",
      items: formatItems(),
    });
  }

  // ─── Semantic Search via Embeddings ─────────────────────
  const query = payload.query ?? "";

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Find top-K most similar items
  const allItems = listKnowledgeItemsWithEmbeddings();
  const topMatches = findTopK(queryEmbedding, allItems, 5);

  const matches = topMatches
    .filter((m) => m.score > 0.1) // minimum relevance threshold
    .map((m) => ({
      id: m.id,
      source: m.source,
      content: m.content,
      created_at: m.created_at,
      score: m.score,
    }));

  const fallback =
    matches.length === 0
      ? "Não encontrei conteúdos semanticamente relacionados. Tente reformular a pergunta."
      : `Encontrei estes pontos relevantes (busca semântica):\n${matches
          .map((m, i) => `${i + 1}. [${m.source}] (${(m.score * 100).toFixed(0)}% relevância) ${m.content}`)
          .join("\n")}`;

  const context = matches
    .map(
      (item, index) =>
        `${index + 1}) Fonte: ${item.source} (relevância: ${(item.score * 100).toFixed(0)}%)\nConteúdo: ${item.content}`
    )
    .join("\n\n");

  const answer = await generateText({
    system:
      "Você responde perguntas de estudo usando somente o contexto fornecido. Se faltar contexto, diga isso claramente. Mencione as fontes quando relevante.",
    user: `Pergunta: ${query}\n\nContexto recuperado (busca semântica):\n${context || "Sem contexto"}`,
    fallback,
  });

  return NextResponse.json({
    answer,
    items: formatItems(),
    provider: getProviderLabel(),
    searchType: "semantic",
    matchCount: matches.length,
  });
}