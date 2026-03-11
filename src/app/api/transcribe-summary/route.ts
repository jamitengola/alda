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
    .split(/\n|\./)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const fallback = [
    "Resumo automático:",
    ...lines.map((line, index) => `${index + 1}. ${line}`),
    "Ações sugeridas: consolidar dúvidas, definir próximos passos e agendar revisão.",
  ].join("\n");

  const provider = getProviderLabel();

  const aiSummary = await generateText({
    system:
      "Você resume transcrições em português de forma objetiva. Traga resumo em tópicos e 3 ações práticas.",
    user: `Transcrição:\n${transcript}`,
    fallback,
  });

  // Persist to SQLite
  saveSummary(transcript, aiSummary, provider);

  return NextResponse.json({ summary: aiSummary, provider });
}

export async function GET() {
  const items = listSummaries();
  return NextResponse.json({ items });
}