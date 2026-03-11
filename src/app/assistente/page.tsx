"use client";

import { FormEvent, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";

export default function AssistentePage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/realtime-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as { answer: string };
      setAnswer(data.answer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Assistente em Tempo Real"
        description="Faça uma pergunta e receba uma sugestão de resposta profissional."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-4 focus:border-blue-400 focus:outline-none"
          placeholder="O que eu devo responder agora?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <LoadingButton loading={loading} label="Obter sugestão" loadingLabel="Pensando..." />
      </form>

      {answer && (
        <div className="mt-6">
          <ResultCard title="Sugestão">{answer}</ResultCard>
        </div>
      )}
    </div>
  );
}
