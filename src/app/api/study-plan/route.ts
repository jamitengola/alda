import { NextRequest, NextResponse } from "next/server";
import { generateText, getProviderLabel } from "@/lib/ai-provider";
import { saveStudyTasks } from "@/lib/db";

type StudyTask = {
  title: string;
  dueDate: string;
  priority: "alta" | "média" | "baixa";
};

function plusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildFallbackTasks(objective: string): StudyTask[] {
  const base = objective || "objetivo de formação";
  return [
    { title: `Definir escopo e metas semanais para: ${base}`, dueDate: plusDays(1), priority: "alta" },
    { title: "Executar bloco de estudo focado (90 min) e registrar dúvidas", dueDate: plusDays(2), priority: "alta" },
    { title: "Prática aplicada: exercícios/projeto curto", dueDate: plusDays(4), priority: "média" },
    { title: "Revisão ativa + checklist de progresso", dueDate: plusDays(6), priority: "baixa" },
  ];
}

function tryParseTasksJson(text: string): StudyTask[] | null {
  // Try direct parse
  try {
    const parsed = JSON.parse(text) as { tasks?: StudyTask[] };
    if (Array.isArray(parsed.tasks)) return parsed.tasks;
    if (Array.isArray(parsed)) return parsed as StudyTask[];
  } catch {
    // continue
  }

  // Extract JSON from markdown code blocks or mixed text
  const jsonMatch = text.match(/\{[\s\S]*"tasks"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { tasks: StudyTask[] };
      if (Array.isArray(parsed.tasks)) return parsed.tasks;
    } catch {
      // continue
    }
  }

  // Try array only
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const arr = JSON.parse(arrayMatch[0]) as StudyTask[];
      if (Array.isArray(arr) && arr.length > 0 && arr[0].title) return arr;
    } catch {
      // fallback
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { objective?: string; duration?: string };
  const objective = body.objective?.trim() ?? "";
  const duration = body.duration?.trim() ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const fallbackTasks = buildFallbackTasks(objective);

  const systemPrompt = `Você é um planejador de estudos especialista. Dado um objetivo de aprendizagem:
1. Divida em etapas semanais concretas e acionáveis
2. Atribua prioridade (alta, média ou baixa) a cada tarefa
3. Defina prazos realistas (formato YYYY-MM-DD) a partir de hoje (${today})
4. Responda APENAS com JSON válido no formato: {"tasks":[{"title":"...","dueDate":"YYYY-MM-DD","priority":"alta|média|baixa"}]}
Sem explicações, sem markdown, apenas o JSON.`;

  const userPrompt = `Objetivo: ${objective || "formação geral"}${duration ? `\nDuração desejada: ${duration}` : ""}`;

  const raw = await generateText({
    system: systemPrompt,
    user: userPrompt,
    fallback: JSON.stringify({ tasks: fallbackTasks }),
  });

  const parsed = tryParseTasksJson(raw);
  const tasks = parsed ?? fallbackTasks;
  const provider = getProviderLabel();

  // Persist to SQLite
  saveStudyTasks(
    objective,
    tasks.map((t) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority }))
  );

  return NextResponse.json({ tasks, provider });
}