import { NextRequest, NextResponse } from "next/server";
import {
  saveCoachingSession,
  listCoachingSessions,
  getCoachingStats,
} from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    duration: number;
    wordCount: number;
    suggestionsUsed: number;
    mode: string;
    topic?: string;
  };

  const id = saveCoachingSession(
    body.duration,
    body.wordCount,
    body.suggestionsUsed,
    body.mode,
    body.topic ?? ""
  );

  return NextResponse.json({ id, saved: true });
}

export async function GET() {
  const sessions = listCoachingSessions(30);
  const stats = getCoachingStats();

  return NextResponse.json({ sessions, stats });
}
