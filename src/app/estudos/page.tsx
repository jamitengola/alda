"use client";

import { FormEvent, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import { toast } from "@/components/Toast";

type StudyTask = {
  title: string;
  dueDate: string;
  priority: "alta" | "média" | "baixa";
};

const PRIORITY_COLORS: Record<string, string> = {
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

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Plano de Estudos"
        description="Defina um objetivo e receba um plano personalizado gerado por IA."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-4 focus:border-blue-400 focus:outline-none"
          placeholder="Objetivo (ex: Certificação AZ-204)"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-4 focus:border-blue-400 focus:outline-none"
          placeholder="Duração (ex: 6 semanas, 30 dias) — opcional"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <LoadingButton loading={loading} label="Gerar plano" loadingLabel="IA planejando..." />
      </form>

      {tasks.length > 0 && (
        <ul className="mt-6 space-y-3">
          {tasks.map((task, i) => (
            <li
              key={`${task.title}-${i}`}
              className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" />
              <div className="flex-1">
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 text-xs opacity-60">Prazo: {task.dueDate}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}
              >
                {task.priority}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
