import { NextRequest, NextResponse } from "next/server";
import { getTimeline, getTimelineItem } from "@/lib/db";

const validTypes = ["coaching", "transcription", "followup"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 200) || undefined;
  const id = searchParams.get("id")?.trim();
  const type = searchParams.get("type")?.trim();
  const requestedLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
  const limit = Number.isNaN(requestedLimit)
    ? 50
    : Math.min(Math.max(requestedLimit, 1), 100);

  if ((id && !type) || (!id && type)) {
    return NextResponse.json(
      { error: "Os parâmetros id e type devem ser enviados em conjunto." },
      { status: 400 },
    );
  }

  if (id && type) {
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de histórico inválido." },
        { status: 400 },
      );
    }

    const item = getTimelineItem(id, type);
    if (!item) {
      return NextResponse.json(
        { error: "Registo não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item });
  }

  const items = getTimeline(q, limit);
  return NextResponse.json({ items });
}
