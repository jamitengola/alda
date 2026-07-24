import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveSummary, listSummaries } from "@/lib/db";
import { readJsonObject, readString } from "@/lib/api-request";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);

  if (!body) {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const transcript = readString(body.transcript);

  if (!transcript) {
    return NextResponse.json(
      { error: "Envie uma transcrição para gerar o resumo." },
      { status: 400 },
    );
  }

  const lines = transcript
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  const mainPoint = lines[0] ?? "A reunião abordou os temas registados na transcrição.";
  const keyPoints = lines.map((line) => `- ${line}`).join("\n");

  const fallback = `## Resumo executivo
${mainPoint}

## Pontos-chave
${keyPoints}

## Decisões a confirmar
- Validar se os pontos discutidos representam corretamente o entendimento dos participantes.
- Confirmar quais propostas foram aprovadas e quais continuam pendentes.
- Registar responsáveis, dependências e prazos antes de iniciar a execução.

## Próximas ações recomendadas
1. Partilhar este resumo com os participantes para validação.
2. Converter cada decisão numa tarefa com responsável e data.
3. Agendar uma revisão curta para os pontos que permaneceram em aberto.

## Riscos de acompanhamento
- Decisões sem responsável podem não avançar.
- Prazos não confirmados podem gerar interpretações diferentes.
- Pontos importantes devem ser revistos no contexto completo da transcrição.`;

  const provider = getProviderLabel();

  const aiSummary = await generateText({
    system:
      "Você resume transcrições em português de forma objetiva. Organize a resposta em resumo executivo, pontos-chave, decisões, responsáveis, prazos, riscos e próximas ações. Não invente decisões que não estejam sustentadas pela transcrição; marque-as como pendentes de confirmação.",
    user: `Transcrição:\n${transcript}`,
    fallback,
  });

  const id = saveSummary(transcript, aiSummary, provider);

  return NextResponse.json({ id, summary: aiSummary, provider });
}

export async function GET() {
  const items = listSummaries();
  return NextResponse.json({ items });
}
