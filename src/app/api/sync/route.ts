import { NextRequest, NextResponse } from "next/server";
import { exportAllData, importAllData } from "@/lib/db";

// GET — export all data as JSON
export async function GET() {
  const data = exportAllData();
  return NextResponse.json(data);
}

// POST — import data from JSON backup
export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data || data.version !== 1) {
    return NextResponse.json({ error: "Formato de backup inválido" }, { status: 400 });
  }

  importAllData(data);
  return NextResponse.json({ success: true, message: "Dados importados com sucesso" });
}
