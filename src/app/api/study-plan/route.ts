import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { objective?: string };
  const objective = body.objective?.trim() ?? "";

  const base = objective || "objetivo de formação";

  const tasks: StudyTask[] = [
    {
      title: `Definir escopo e metas semanais para: ${base}`,
      dueDate: plusDays(1),
      priority: "alta",
    },
    {
      title: "Executar bloco de estudo focado (90 min) e registrar dúvidas",
      dueDate: plusDays(2),
      priority: "alta",
    },
    {
      title: "Prática aplicada: exercícios/projeto curto",
      dueDate: plusDays(4),
      priority: "média",
    },
    {
      title: "Revisão ativa + checklist de progresso",
      dueDate: plusDays(6),
      priority: "baixa",
    },
  ];

  return NextResponse.json({ tasks });
}