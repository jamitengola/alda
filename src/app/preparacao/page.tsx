"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, Users, Target, StickyNote } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import { toast } from "@/components/Toast";

export default function PreparacaoPage() {
  const [topic, setTopic] = useState("");
  const [participants, setParticipants] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      toast("Informe pelo menos o tema da reunião.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/meeting-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, participants, objective, notes }),
      });
      const data = (await res.json()) as { briefing: string };
      setBriefing(data.briefing);
      toast("Briefing gerado!");
    } catch {
      toast("Erro ao gerar briefing", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Preparação de Reunião"
        description="Gere um briefing estratégico antes da sua reunião com pontos-chave, objeções antecipadas e perguntas táticas."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Topic */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium opacity-70">
            <ClipboardList className="h-4 w-4" />
            Tema / Pauta *
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
            placeholder="Ex: Apresentação do produto para empresa X"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* Participants */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium opacity-70">
            <Users className="h-4 w-4" />
            Participantes
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
            placeholder="Ex: João (CEO), Maria (CTO), Pedro (Dev Lead)"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          />
        </div>

        {/* Objective */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium opacity-70">
            <Target className="h-4 w-4" />
            Objetivo
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
            placeholder="Ex: Fechar contrato de licenciamento"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium opacity-70">
            <StickyNote className="h-4 w-4" />
            Anotações / Contexto extra
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none resize-y"
            rows={3}
            placeholder="Ex: Na última reunião eles demonstraram preocupação com preço..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <LoadingButton loading={loading} label="Gerar briefing" loadingLabel="Preparando..." />
      </form>

      {briefing && (
        <div className="mt-8">
          <ResultCard title="Briefing estratégico">{briefing}</ResultCard>
        </div>
      )}
    </div>
  );
}
