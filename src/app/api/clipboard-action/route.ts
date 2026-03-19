import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai-provider";

const PROMPTS: Record<string, { system: string; prefix: string; fallback: string }> = {
  summarize: {
    system: "Você resume textos de forma objetiva em português. Retorne tópicos e pontos-chave.",
    prefix: "Resuma o seguinte texto:\n\n",
    fallback: "Resumo: texto recebido para processamento. Verifique a conexão com o modelo.",
  },
  translate: {
    system:
      "Você é um tradutor profissional. Detecte o idioma de origem e traduza: se for português, traduza para inglês; caso contrário, traduza para português. Retorne apenas a tradução.",
    prefix: "Traduza:\n\n",
    fallback: "Tradução não disponível no momento. Verifique a conexão com o modelo.",
  },
  followup: {
    system:
      "Você é um assistente de comunicação profissional em português. Gere uma resposta de follow-up educada e objetiva para o texto recebido.",
    prefix: "Gere um follow-up para:\n\n",
    fallback: "Follow-up: obrigado pela mensagem. Vou analisar e retorno em breve.",
  },
  explain: {
    system:
      "Você explica conceitos de forma clara e didática em português. Use analogias quando útil.",
    prefix: "Explique o seguinte:\n\n",
    fallback: "Explicação: o texto recebido aborda um conceito que requer análise mais detalhada.",
  },
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: string; action?: string };
  const text = body.text?.trim() ?? "";
  const action = body.action ?? "summarize";

  if (!text) {
    return NextResponse.json({ result: "Nenhum texto recebido." });
  }

  const prompt = PROMPTS[action] ?? PROMPTS.summarize;

  const result = await generateText({
    system: prompt.system,
    user: `${prompt.prefix}${text}`,
    fallback: prompt.fallback,
  });

  return NextResponse.json({ result });
}
