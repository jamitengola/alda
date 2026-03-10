"use client";

import { FormEvent, useMemo, useState } from "react";

type StudyTask = {
  title: string;
  dueDate: string;
  priority: "alta" | "média" | "baixa";
};

type KnowledgeNote = {
  id: string;
  source: string;
  content: string;
  createdAt: string;
};

async function callApi<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Falha ao processar pedido");
  }

  return (await response.json()) as T;
}

export default function Home() {
  const [meetingInput, setMeetingInput] = useState("");
  const [meetingSummary, setMeetingSummary] = useState("");

  const [realtimeQuestion, setRealtimeQuestion] = useState("");
  const [realtimeAnswer, setRealtimeAnswer] = useState("");

  const [studyObjective, setStudyObjective] = useState("");
  const [studyPlan, setStudyPlan] = useState<StudyTask[]>([]);

  const [followupContext, setFollowupContext] = useState("");
  const [followupText, setFollowupText] = useState("");

  const [knowledgeSource, setKnowledgeSource] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeNote[]>([]);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeResult, setKnowledgeResult] = useState("");

  const [loading, setLoading] = useState<string | null>(null);

  const canAddKnowledge = useMemo(
    () => knowledgeSource.trim() && knowledgeContent.trim(),
    [knowledgeContent, knowledgeSource],
  );

  async function onGenerateSummary(e: FormEvent) {
    e.preventDefault();
    setLoading("summary");
    try {
      const data = await callApi<{ summary: string }>("/api/transcribe-summary", {
        transcript: meetingInput,
      });
      setMeetingSummary(data.summary);
    } finally {
      setLoading(null);
    }
  }

  async function onRealtimeAnswer(e: FormEvent) {
    e.preventDefault();
    setLoading("realtime");
    try {
      const data = await callApi<{ answer: string }>("/api/realtime-assist", {
        question: realtimeQuestion,
      });
      setRealtimeAnswer(data.answer);
    } finally {
      setLoading(null);
    }
  }

  async function onGenerateStudyPlan(e: FormEvent) {
    e.preventDefault();
    setLoading("study");
    try {
      const data = await callApi<{ tasks: StudyTask[] }>("/api/study-plan", {
        objective: studyObjective,
      });
      setStudyPlan(data.tasks);
    } finally {
      setLoading(null);
    }
  }

  async function onGenerateFollowup(e: FormEvent) {
    e.preventDefault();
    setLoading("followup");
    try {
      const data = await callApi<{ followup: string }>("/api/follow-up", {
        context: followupContext,
      });
      setFollowupText(data.followup);
    } finally {
      setLoading(null);
    }
  }

  async function onAddKnowledge(e: FormEvent) {
    e.preventDefault();
    setLoading("knowledge-add");
    try {
      const data = await callApi<{ items: KnowledgeNote[] }>("/api/knowledge", {
        action: "add",
        source: knowledgeSource,
        content: knowledgeContent,
      });
      setKnowledgeItems(data.items);
      setKnowledgeSource("");
      setKnowledgeContent("");
    } finally {
      setLoading(null);
    }
  }

  async function onAskKnowledge(e: FormEvent) {
    e.preventDefault();
    setLoading("knowledge-query");
    try {
      const data = await callApi<{ answer: string; items: KnowledgeNote[] }>(
        "/api/knowledge",
        {
          action: "query",
          query: knowledgeQuery,
        },
      );
      setKnowledgeResult(data.answer);
      setKnowledgeItems(data.items);
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border p-5">
          <h1 className="text-2xl font-semibold">ALDA Assistant</h1>
          <p className="text-sm opacity-80">
            MVP inspirado no fluxo do Cluely para tarefas e formações.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold">1) Transcrição + Resumo</h2>
            <form onSubmit={onGenerateSummary} className="space-y-3">
              <textarea
                className="w-full rounded-md border p-3"
                rows={6}
                placeholder="Cole transcrição de reunião/aula aqui..."
                value={meetingInput}
                onChange={(e) => setMeetingInput(e.target.value)}
              />
              <button className="rounded-md border px-4 py-2" disabled={loading === "summary"}>
                {loading === "summary" ? "Gerando..." : "Gerar resumo"}
              </button>
            </form>
            {meetingSummary && <p className="text-sm whitespace-pre-wrap">{meetingSummary}</p>}
          </article>

          <article className="rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold">2) Assistente em tempo real</h2>
            <form onSubmit={onRealtimeAnswer} className="space-y-3">
              <input
                className="w-full rounded-md border p-3"
                placeholder="O que eu devo responder agora?"
                value={realtimeQuestion}
                onChange={(e) => setRealtimeQuestion(e.target.value)}
              />
              <button className="rounded-md border px-4 py-2" disabled={loading === "realtime"}>
                {loading === "realtime" ? "Respondendo..." : "Obter sugestão"}
              </button>
            </form>
            {realtimeAnswer && <p className="text-sm whitespace-pre-wrap">{realtimeAnswer}</p>}
          </article>

          <article className="rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold">3) Plano de estudos + tarefas</h2>
            <form onSubmit={onGenerateStudyPlan} className="space-y-3">
              <input
                className="w-full rounded-md border p-3"
                placeholder="Objetivo (ex: Certificação AZ-204 em 6 semanas)"
                value={studyObjective}
                onChange={(e) => setStudyObjective(e.target.value)}
              />
              <button className="rounded-md border px-4 py-2" disabled={loading === "study"}>
                {loading === "study" ? "Planejando..." : "Gerar plano"}
              </button>
            </form>
            {studyPlan.length > 0 && (
              <ul className="text-sm space-y-2">
                {studyPlan.map((task, index) => (
                  <li key={`${task.title}-${index}`} className="rounded-md border p-2">
                    <p className="font-medium">{task.title}</p>
                    <p>
                      Prioridade: {task.priority} · Prazo: {task.dueDate}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold">4) Follow-up automático</h2>
            <form onSubmit={onGenerateFollowup} className="space-y-3">
              <textarea
                className="w-full rounded-md border p-3"
                rows={5}
                placeholder="Resumo da reunião ou formação para gerar follow-up"
                value={followupContext}
                onChange={(e) => setFollowupContext(e.target.value)}
              />
              <button className="rounded-md border px-4 py-2" disabled={loading === "followup"}>
                {loading === "followup" ? "Gerando..." : "Gerar follow-up"}
              </button>
            </form>
            {followupText && <p className="text-sm whitespace-pre-wrap">{followupText}</p>}
          </article>
        </section>

        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">5) Base de conhecimento pessoal (RAG simples)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={onAddKnowledge} className="space-y-3">
              <input
                className="w-full rounded-md border p-3"
                placeholder="Fonte (ex: Aula 1 - Cloud)"
                value={knowledgeSource}
                onChange={(e) => setKnowledgeSource(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border p-3"
                rows={4}
                placeholder="Conteúdo-chave para memorizar"
                value={knowledgeContent}
                onChange={(e) => setKnowledgeContent(e.target.value)}
              />
              <button
                className="rounded-md border px-4 py-2"
                disabled={!canAddKnowledge || loading === "knowledge-add"}
              >
                {loading === "knowledge-add" ? "Guardando..." : "Adicionar conhecimento"}
              </button>
            </form>

            <form onSubmit={onAskKnowledge} className="space-y-3">
              <input
                className="w-full rounded-md border p-3"
                placeholder="Pergunte algo sobre seu material"
                value={knowledgeQuery}
                onChange={(e) => setKnowledgeQuery(e.target.value)}
              />
              <button className="rounded-md border px-4 py-2" disabled={loading === "knowledge-query"}>
                {loading === "knowledge-query" ? "Buscando..." : "Consultar base"}
              </button>
              {knowledgeResult && <p className="text-sm whitespace-pre-wrap">{knowledgeResult}</p>}
            </form>
          </div>

          {knowledgeItems.length > 0 && (
            <ul className="space-y-2 text-sm">
              {knowledgeItems.map((item) => (
                <li key={item.id} className="rounded-md border p-3">
                  <p className="font-medium">{item.source}</p>
                  <p className="opacity-80">{item.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
