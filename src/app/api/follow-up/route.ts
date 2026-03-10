import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { context?: string };
  const context = body.context?.trim() ?? "";

  const followup = [
    "Assunto: Follow-up da sessão",
    "",
    "Olá,",
    "",
    "Obrigado pela sessão de hoje. Segue resumo rápido:",
    context ? `- Contexto principal: ${context}` : "- Contexto principal: (não informado)",
    "- Próximos passos: consolidar decisões, definir responsáveis e prazos.",
    "- Ação sugerida: revisar este resumo em 24h para ajustes finais.",
    "",
    "Abraço,",
    "ALDA Assistant",
  ].join("\n");

  const aiFollowup = await generateText({
    system:
      "Você escreve emails de follow-up profissionais em português, curtos e orientados a ação.",
    user: `Gere um follow-up com base neste contexto:\n${context || "Sem contexto"}`,
    fallback: followup,
  });

  return NextResponse.json({ followup: aiFollowup, provider: getProviderLabel() });
}