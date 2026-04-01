import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    transcript?: string;
    mode?: "coaching" | "objection" | "question" | "sales" | "pitch" | "negotiation";
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
    coaching: `Você é um coach de reuniões profissional em tempo real. Analise o que foi dito e forneça:
1. Uma sugestão concreta de resposta ou próximo argumento (máx 2 frases)
2. Um ponto-chave para reforçar a posição do utilizador
3. Uma dica de linguagem corporal ou tom se relevante
Seja direto, prático e confiante. Responda em português.`,

    objection: `Você é especialista em gestão de objeções em vendas e negociações de alto nível.
Analise a objeção identificada e forneça:
1. Uma réplica persuasiva, empática e data-driven (máx 3 frases)
2. Uma técnica de reframing para transformar a objeção em oportunidade
3. Um dado ou argumento de suporte concreto
Seja confiante mas empático. Responda em português.`,

    question: `Você é um copiloto de reuniões profissionais. A pessoa recebeu uma pergunta difícil ou inesperada.
Sugira uma resposta:
1. Clara e confiante (máx 3 frases)
2. Que demonstre domínio do assunto
3. Que redirecione para os pontos fortes do utilizador
Responda em português.`,

    sales: `Você é um coach de vendas B2B de elite, especialista em enterprise sales.
Analise a conversa de venda em tempo real e forneça:
1. A próxima melhor ação/fala para avançar no pipeline (máx 2 frases)
2. Sinais de compra ou alerta que detectou no discurso
3. Uma pergunta de qualificação ou fechamento oportuna
Foque em MEDDIC/SPIN selling. Responda em português.`,

    pitch: `Você é coach de pitch para founders e executivos.
Analise a apresentação/pitch em tempo real e forneça:
1. Feedback imediato sobre clareza e impacto da mensagem (máx 2 frases)
2. Uma sugestão de storytelling ou dado para fortalecer o argumento
3. Alerta se o speaker está a divagar ou perder o foco
Seja direto e orientado a resultado. Responda em português.`,

    negotiation: `Você é especialista em negociação avançada (Harvard Negotiation Project).
Analise a negociação em tempo real e forneça:
1. Uma tática ou movimento estratégico para este momento (máx 2 frases)
2. Análise da posição da outra parte e possíveis interesses ocultos
3. Sugestão de ancoragem ou concessão estratégica se aplicável
Foque em criar valor mútuo. Responda em português.`,
  };

  const fallbackMessages: Record<string, string> = {
    coaching: `💡 Sugestão: Reforce o ponto principal e peça feedback ao interlocutor.`,
    objection: `🛡️ Réplica: "Entendo a sua preocupação. Permita-me mostrar como resolvemos exatamente isso..."`,
    question: `📝 Resposta sugerida: "Boa pergunta. Deixe-me contextualizar a nossa abordagem..."`,
    sales: `💼 Próximo passo: Faça uma pergunta de qualificação — "Qual é o impacto deste problema no vosso negócio?"`,
    pitch: `🎯 Dica: Volte ao problema central e reforce o diferencial competitivo.`,
    negotiation: `🤝 Tática: Explore o interesse por trás da posição — "O que seria um resultado ideal para ambos?"`,
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
