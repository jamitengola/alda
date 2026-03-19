"use client";

import { FormEvent, useState } from "react";
import { ClipboardList, Users, Target, StickyNote, Sparkles, Mic, MessageSquare, ChevronRight, CheckCircle } from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import ExportButtons from "@/components/ExportButtons";
import { toast } from "@/components/Toast";
import useDictation from "@/hooks/useDictation";

type Tab = "briefing" | "entrevista";

export default function PreparacaoPage() {
  const [tab, setTab] = useState<Tab>("briefing");

  // ── Briefing state ──
  const [topic, setTopic] = useState("");
  const [participants, setParticipants] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Interview Mode state ──
  const [interviewTopic, setInterviewTopic] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [completedQs, setCompletedQs] = useState<Set<number>>(new Set());

  useDictation((text) => {
    if (tab === "briefing") setNotes((prev) => prev ? `${prev} ${text}` : text);
    else setAnswer((prev) => prev ? `${prev} ${text}` : text);
  });

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

  async function generateQuestions(e: FormEvent) {
    e.preventDefault();
    if (!interviewTopic.trim()) {
      toast("Informe o tema da entrevista.", "error");
      return;
    }
    setLoadingInterview(true);
    setQuestions([]);
    setCurrentQ(0);
    setAnswer("");
    setFeedback("");
    setCompletedQs(new Set());
    try {
      const res = await fetch("/api/interview-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: interviewTopic, action: "generate" }),
      });
      const data = (await res.json()) as { questions: string[] };
      setQuestions(data.questions);
      toast(`${data.questions.length} perguntas geradas!`);
    } catch {
      toast("Erro ao gerar perguntas", "error");
    } finally {
      setLoadingInterview(false);
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) {
      toast("Escreva ou dite sua resposta primeiro.", "error");
      return;
    }
    setLoadingFeedback(true);
    setFeedback("");
    try {
      const res = await fetch("/api/interview-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: interviewTopic,
          action: "feedback",
          question: questions[currentQ],
          answer,
        }),
      });
      const data = (await res.json()) as { feedback: string };
      setFeedback(data.feedback);
      setCompletedQs((prev) => new Set(prev).add(currentQ));
    } catch {
      toast("Erro ao obter feedback", "error");
    } finally {
      setLoadingFeedback(false);
    }
  }

  function goToQuestion(idx: number) {
    setCurrentQ(idx);
    setAnswer("");
    setFeedback("");
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-colors";

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-xs font-semibold uppercase rounded-t-lg transition-colors ${
      tab === t
        ? "bg-white dark:bg-gray-900/50 border border-b-0 border-gray-200 dark:border-gray-800 text-blue-600 dark:text-blue-400"
        : "opacity-50 hover:opacity-80"
    }`;

  return (
    <div className="flex h-full flex-col animate-[fade-in_0.4s_ease-out]">
      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-0">
        <button className={tabCls("briefing")} onClick={() => setTab("briefing")}>
          <ClipboardList className="h-3.5 w-3.5 inline mr-1.5" />
          Briefing
        </button>
        <button className={tabCls("entrevista")} onClick={() => setTab("entrevista")}>
          <Mic className="h-3.5 w-3.5 inline mr-1.5" />
          Modo Entrevista
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 flex gap-6 min-h-0">
        {tab === "briefing" ? (
          /* ════════════ BRIEFING TAB ════════════ */
          <>
            {/* Left: Form */}
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

            {/* Right: Result */}
            <section className="flex-1 flex flex-col min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <h2 className="text-sm font-semibold uppercase opacity-60">Briefing</h2>
                <div className="ml-auto">
                  <ExportButtons title="Briefing — Preparação" content={briefing} filename="alda-briefing" />
                </div>
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
          </>
        ) : (
          /* ════════════ INTERVIEW MODE TAB ════════════ */
          <>
            {/* Left: Topic + Question list */}
            <div className="w-80 shrink-0 flex flex-col">
              <div className="mb-5">
                <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-500" />
                  Modo Entrevista
                </h1>
                <p className="text-xs opacity-50 mt-1">Simule entrevistas e receba feedback da IA</p>
              </div>

              <form onSubmit={generateQuestions} className="space-y-4 mb-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
                    <Target className="h-3.5 w-3.5" />
                    Tema da entrevista
                  </label>
                  <input
                    className={inputCls}
                    placeholder="React, System Design, Liderança..."
                    value={interviewTopic}
                    onChange={(e) => setInterviewTopic(e.target.value)}
                  />
                </div>
                <LoadingButton loading={loadingInterview} label="Gerar perguntas" loadingLabel="Gerando..." />
              </form>

              {/* Question list */}
              {questions.length > 0 && (
                <div className="flex-1 overflow-y-auto styled-scroll space-y-1.5">
                  <p className="text-[11px] uppercase font-medium opacity-40 mb-2">Perguntas</p>
                  {questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => goToQuestion(i)}
                      className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                        i === currentQ
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {completedQs.has(i) ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-current shrink-0 flex items-center justify-center text-[9px]">
                          {i + 1}
                        </span>
                      )}
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Answer + Feedback */}
            <section className="flex-1 flex flex-col min-w-0">
              {questions.length === 0 ? (
                <div className="flex-1 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                  <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-xs">
                    Escolha um tema à esquerda e gere perguntas.
                    <br />
                    <span className="text-xs opacity-60 mt-1 block">
                      A IA criará perguntas variadas para você praticar.
                    </span>
                  </p>
                </div>
              ) : (
                <>
                  {/* Current question */}
                  <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 mb-4">
                    <p className="text-[11px] uppercase font-medium opacity-40 mb-1">
                      Pergunta {currentQ + 1} de {questions.length}
                    </p>
                    <p className="text-sm font-medium">{questions[currentQ]}</p>
                  </div>

                  {/* Answer */}
                  <div className="mb-3">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase opacity-50">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Sua resposta
                    </label>
                    <textarea
                      className={`${inputCls} resize-none min-h-[120px]`}
                      placeholder="Escreva sua resposta aqui..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={submitAnswer}
                      disabled={loadingFeedback || !answer.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 py-2 text-xs font-medium text-white transition-colors"
                    >
                      {loadingFeedback ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {loadingFeedback ? "Analisando..." : "Obter feedback"}
                    </button>
                    {currentQ < questions.length - 1 && (
                      <button
                        onClick={() => goToQuestion(currentQ + 1)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
                      >
                        Próxima
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Feedback */}
                  {feedback && (
                    <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <h3 className="text-sm font-semibold uppercase opacity-60">Feedback da IA</h3>
                      </div>
                      <ResultCard>{feedback}</ResultCard>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
