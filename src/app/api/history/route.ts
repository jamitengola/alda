import { NextRequest, NextResponse } from "next/server";
import { getTimeline, getTimelineItem } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  // Detail view
  if (id && type) {
    const item = getTimelineItem(id, type);
    return NextResponse.json({ item });
  }

  // Timeline list
  const items = getTimeline(q, 50);
  return NextResponse.json({ items });
}
