import { NextRequest, NextResponse } from "next/server";
import { listPlugins, savePlugin, deletePlugin } from "@/lib/plugins";

// GET — list all plugins
export async function GET() {
  const plugins = listPlugins();
  return NextResponse.json({ plugins });
}

// POST — create/update a plugin
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, name, description, icon, version, actions } = body;

  if (!slug || !name || !Array.isArray(actions)) {
    return NextResponse.json({ error: "Campos obrigatórios: slug, name, actions" }, { status: 400 });
  }

  savePlugin(slug, { name, description: description || "", icon: icon || "Puzzle", version: version || "1.0.0", actions });
  return NextResponse.json({ success: true });
}

// DELETE — remove a plugin
export async function DELETE(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: "slug é obrigatório" }, { status: 400 });
  }

  const removed = deletePlugin(slug);
  return NextResponse.json({ removed });
}
