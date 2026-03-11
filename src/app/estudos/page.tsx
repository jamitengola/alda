"use client";

import { FormEvent, useState } from "react";
import { BookOpen, Target, Clock } from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import { toast } from "@/components/Toast";

type StudyTask = {
  title: string;
  dueDate: string;
  priority: "alta" | "média" | "baixa";
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-500",
  média: "bg-amber-500",
  baixa: "bg-green-500",
};

const PRIORITY_BG: Record<string, string> = {
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  média: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  baixa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export default function EstudosPage() {
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState("");
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, duration }),
      });
      const data = (await res.json()) as { tasks: StudyTask[] };
      setTasks(data.tasks);
      toast(`Plano gerado com ${data.tasks.length} tarefas!`);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-colors";

  return (
    <div className="flex h-full gap-6 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Left: Form (compact) ─── */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="mb-5">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            Plano de Estudos
          </h1>
          <p className="text-xs opacity-50 mt-1">IA gera tarefas priorizadas com prazos</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
              <Target className="h-3.5 w-3.5" />
              Objetivo
            </label>
            <input className={inputCls} placeholder="Certificação AZ-204" value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
              <Clock className="h-3.5 w-3.5" />
              Duração (opcional)
            </label>
            <input className={inputCls} placeholder="6 semanas, 30 dias..." value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <LoadingButton loading={loading} label="Gerar plano" loadingLabel="IA planejando..." />
        </form>

        {/* Summary */}
        {tasks.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <p className="text-xs opacity-50 uppercase font-medium mb-1">Resumo</p>
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-xs opacity-40">tarefas geradas</p>
            <div className="mt-2 flex gap-3">
              {(["alta", "média", "baixa"] as const).map((p) => {
                const count = tasks.filter((t) => t.priority === p).length;
                return count > 0 ? (
                  <span key={p} className="flex items-center gap-1 text-[11px] opacity-60">
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[p]}`} />
                    {count} {p}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Right: Task list (expands) ─── */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase opacity-60">Tarefas</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="flex-1 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-xs">
              Defina um objetivo à esquerda e clique em &quot;Gerar plano&quot;.
              <br />
              <span className="text-xs opacity-60 mt-1 block">A IA criará tarefas priorizadas.</span>
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto styled-scroll space-y-2 pr-1">
            {tasks.map((task, i) => (
              <div
                key={`${task.title}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 hover:border-blue-400/50 transition-colors group"
              >
                <input type="checkbox" className="h-4 w-4 accent-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-blue-500 transition-colors">{task.title}</p>
                  <p className="text-[11px] opacity-40 mt-0.5">Prazo: {task.dueDate}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${PRIORITY_BG[task.priority] ?? ""}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
