import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveSummary, listSummaries } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { transcript?: string };
  const transcript = body.transcript?.trim() ?? "";

  if (!transcript) {
    return NextResponse.json({ summary: "Envie uma transcrição para gerar o resumo." });
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
      "Você resume transcrições em português de forma objetiva. Traga resumo em tópicos e 3 ações práticas.",
    user: `Transcrição:\n${transcript}`,
    fallback,
  });

  saveSummary(transcript, aiSummary, provider);

  return NextResponse.json({ summary: aiSummary, provider });
}

export async function GET() {
  const items = listSummaries();
  return NextResponse.json({ items });
}
