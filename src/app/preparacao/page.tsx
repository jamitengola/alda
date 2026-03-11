"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, Users, Target, StickyNote, Sparkles } from "lucide-react";
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

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-colors";

  return (
    <div className="flex h-full gap-6 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Left: Form ─── */}
      <div className="w-96 shrink-0 flex flex-col">
        <div className="mb-5">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-500" />
            Preparação
          </h1>
          <p className="text-xs opacity-50 mt-1">Briefing estratégico pré-reunião</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
              <ClipboardList className="h-3.5 w-3.5" />
              Tema / Pauta *
            </label>
            <input className={inputCls} placeholder="Apresentação do produto para empresa X" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
                <Users className="h-3.5 w-3.5" />
                Participantes
              </label>
              <input className={inputCls} placeholder="João (CEO), Maria (CTO)" value={participants} onChange={(e) => setParticipants(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
                <Target className="h-3.5 w-3.5" />
                Objetivo
              </label>
              <input className={inputCls} placeholder="Fechar contrato" value={objective} onChange={(e) => setObjective(e.target.value)} />
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
              <StickyNote className="h-3.5 w-3.5" />
              Notas / Contexto
            </label>
            <textarea
              className={`${inputCls} resize-none h-full min-h-[100px]`}
              placeholder="Contexto extra, preocupações levantadas anteriormente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <LoadingButton loading={loading} label="Gerar briefing" loadingLabel="Preparando..." />
        </form>
      </div>

      {/* ─── Right: Result (expands) ─── */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-500" />
          <h2 className="text-sm font-semibold uppercase opacity-60">Briefing</h2>
        </div>

        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll">
          {briefing ? (
            <ResultCard>{briefing}</ResultCard>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-xs">
                Preencha os dados à esquerda e gere um briefing estratégico.
                <br />
                <span className="text-xs opacity-60 mt-2 block">
                  Inclui pontos-chave, objeções antecipadas e perguntas táticas.
                </span>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
