import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    transcript?: string;
    mode?: "coaching" | "objection" | "question";
  };

  const transcript = body.transcript?.trim() ?? "";
  const mode = body.mode ?? "coaching";

  if (!transcript) {
    return NextResponse.json({
      suggestion: "Aguardando fala para sugerir...",
      mode,
    });
  }

  const systemPrompts: Record<string, string> = {
    coaching: `Você é um coach de reuniões em tempo real. Analise o que foi dito e forneça:
1. Uma sugestão curta de resposta ou próximo argumento (máx 2 frases)
2. Um ponto-chave para reforçar
Seja direto e profissional. Responda em português.`,

    objection: `Você é especialista em gestão de objeções em vendas e negociações.
Analise a objeção identificada e forneça:
1. Uma réplica persuasiva e respeitosa (máx 3 frases)
2. Um dado ou argumento de suporte
Seja confiante mas empático. Responda em português.`,

    question: `Você é um copiloto de reuniões. A pessoa recebeu esta pergunta difícil.
Sugira uma resposta clara, confiante e profissional em no máximo 3 frases.
Responda em português.`,
  };

  const fallbackMessages: Record<string, string> = {
    coaching: `💡 Sugestão: Reforce o ponto principal e peça feedback ao interlocutor.`,
    objection: `🛡️ Réplica: "Entendo a sua preocupação. Permita-me mostrar como resolvemos exatamente isso..."`,
    question: `📝 Resposta sugerida: "Boa pergunta. Deixe-me contextualizar a nossa abordagem..."`,
  };

  const suggestion = await generateText({
    system: systemPrompts[mode] || systemPrompts.coaching,
    user: `Transcrição em tempo real: "${transcript}"`,
    fallback: fallbackMessages[mode] || fallbackMessages.coaching,
  });

  return NextResponse.json({
    suggestion,
    mode,
    provider: getProviderLabel(),
  });
}
