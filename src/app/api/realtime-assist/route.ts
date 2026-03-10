import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { question?: string };
  const question = body.question?.trim() ?? "";

  if (!question) {
    return NextResponse.json({ answer: "Faça uma pergunta para eu sugerir uma resposta." });
  }

  const answer = [
    "Sugestão de resposta:",
    `"Boa pergunta. Sobre '${question}', proponho alinharmos objetivo, prazo e critério de sucesso para decidir o próximo passo com clareza."`,
  ].join("\n");

  const aiAnswer = await generateText({
    system:
      "Você é um copiloto de reuniões e deve sugerir respostas curtas, claras e profissionais em português.",
    user: `Pergunta do usuário durante reunião: ${question}`,
    fallback: answer,
  });

  return NextResponse.json({ answer: aiAnswer, provider: getProviderLabel() });
}