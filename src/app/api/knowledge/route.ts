import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import {
  addKnowledgeItem,
  getKnowledgeMatches,
  listKnowledgeItems,
  queryKnowledge,
} from "@/lib/knowledge-store";

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

  if (payload.action === "add") {
    const source = payload.source?.trim() ?? "";
    const content = payload.content?.trim() ?? "";

    if (!source || !content) {
      return NextResponse.json({
        answer: "Preencha fonte e conteúdo para adicionar conhecimento.",
        items: listKnowledgeItems(),
      });
    }

    addKnowledgeItem(source, content);
    return NextResponse.json({
      answer: "Conhecimento adicionado com sucesso.",
      items: listKnowledgeItems(),
    });
  }

  const query = payload.query ?? "";
  const fallback = queryKnowledge(query);
  const matches = getKnowledgeMatches(query, 5);

  const context = matches
    .map((item, index) => `${index + 1}) Fonte: ${item.source}\nConteúdo: ${item.content}`)
    .join("\n\n");

  const answer = await generateText({
    system:
      "Você responde perguntas de estudo usando somente o contexto fornecido. Se faltar contexto, diga isso claramente.",
    user: `Pergunta: ${query}\n\nContexto recuperado:\n${context || "Sem contexto"}`,
    fallback,
  });

  return NextResponse.json({ answer, items: listKnowledgeItems(), provider: getProviderLabel() });
}