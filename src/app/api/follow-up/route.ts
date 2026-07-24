import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveFollowup, listFollowups } from "@/lib/db";
import { readJsonObject, readString } from "@/lib/api-request";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);

  if (!body) {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const context = readString(body.context);

  if (!context) {
    return NextResponse.json(
      { error: "Informe o resumo ou contexto da reunião." },
      { status: 400 },
    );
  }

  const fallback = [
    "Assunto: Follow-up da reunião e próximos passos",
    "",
    "Olá,",
    "",
    "Obrigado pela reunião. Para mantermos o alinhamento, segue um resumo objetivo do que deve ser validado:",
    "",
    "Contexto principal:",
    context,
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
      "Você escreve emails de follow-up profissionais em português, curtos e orientados a ação. Inclua assunto, contexto, decisões confirmadas ou pendentes, ações, responsáveis e prazos quando estiverem disponíveis. Não invente nomes, decisões ou datas.",
    user: `Gere um follow-up com base neste contexto:\n${context}`,
    fallback,
  });

  const id = saveFollowup(context, aiFollowup, provider);

  return NextResponse.json({ id, followup: aiFollowup, provider });
}

export async function GET() {
  const items = listFollowups();
  return NextResponse.json({ items });
}
