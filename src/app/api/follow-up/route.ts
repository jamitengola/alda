import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveFollowup, listFollowups } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { context?: string };
  const context = body.context?.trim() ?? "";

  const fallback = [
    "Assunto: Follow-up da reunião e próximos passos",
    "",
    "Olá,",
    "",
    "Obrigado pela reunião. Para mantermos o alinhamento, segue um resumo objetivo do que deve ser validado:",
    "",
    "Contexto principal:",
    context || "A reunião tratou do alinhamento de prioridades e definição dos próximos passos.",
    "",
    "Decisões a confirmar:",
    "- Validar o objetivo e o resultado esperado.",
    "- Confirmar o escopo, as restrições e os critérios de sucesso.",
    "- Identificar eventuais pontos pendentes antes da execução.",
    "",
    "Próximas ações:",
    "1. Consolidar as decisões num documento partilhado.",
    "2. Definir um responsável e uma data para cada ação.",
    "3. Rever os pontos pendentes e confirmar o próximo encontro.",
    "",
    "Por favor, partilhem correções ou observações para fecharmos o registo da reunião.",
    "",
    "Cumprimentos,",
    "ALDA Assistant",
  ].join("\n");

  const provider = getProviderLabel();

  const aiFollowup = await generateText({
    system:
      "Você escreve emails de follow-up profissionais em português, curtos e orientados a ação.",
    user: `Gere um follow-up com base neste contexto:\n${context || "Sem contexto"}`,
    fallback,
  });

  saveFollowup(context, aiFollowup, provider);

  return NextResponse.json({ followup: aiFollowup, provider });
}

export async function GET() {
  const items = listFollowups();
  return NextResponse.json({ items });
}
