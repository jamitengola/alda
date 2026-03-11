import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveFollowup, listFollowups } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { context?: string };
  const context = body.context?.trim() ?? "";

  const fallback = [
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

  const provider = getProviderLabel();

  const aiFollowup = await generateText({
    system:
      "Você escreve emails de follow-up profissionais em português, curtos e orientados a ação.",
    user: `Gere um follow-up com base neste contexto:\n${context || "Sem contexto"}`,
    fallback,
  });

  // Persist to SQLite
  saveFollowup(context, aiFollowup, provider);

  return NextResponse.json({ followup: aiFollowup, provider });
}

export async function GET() {
  const items = listFollowups();
  return NextResponse.json({ items });
}