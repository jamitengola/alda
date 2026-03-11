"use client";

import { FormEvent, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import { toast } from "@/components/Toast";

type KnowledgeNote = {
  id: string;
  source: string;
  content: string;
  createdAt: string;
};

export default function ConhecimentoPage() {
  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [items, setItems] = useState<KnowledgeNote[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setLoadingAdd(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", source, content }),
      });
      const data = (await res.json()) as { items: KnowledgeNote[] };
      setItems(data.items);
      setSource("");
      setContent("");
      toast("Conhecimento adicionado!");
    } finally {
      setLoadingAdd(false);
    }
  }

  async function onQuery(e: FormEvent) {
    e.preventDefault();
    setLoadingQuery(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "query", query }),
      });
      const data = (await res.json()) as { answer: string; items: KnowledgeNote[] };
      setResult(data.answer);
      setItems(data.items);
    } finally {
      setLoadingQuery(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Base de Conhecimento"
        description="Adicione notas de estudo e consulte-as com busca inteligente."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-sm uppercase opacity-60">Adicionar</h2>
          <form onSubmit={onAdd} className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
              placeholder="Fonte (ex: Aula 1 - Cloud)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
              rows={4}
              placeholder="Conteúdo-chave para memorizar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <LoadingButton
              loading={loadingAdd}
              label="Adicionar"
              loadingLabel="Guardando..."
              disabled={!source.trim() || !content.trim()}
            />
          </form>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-sm uppercase opacity-60">Consultar</h2>
          <form onSubmit={onQuery} className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-3 focus:border-blue-400 focus:outline-none"
              placeholder="Pergunte algo sobre seu material..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <LoadingButton
              loading={loadingQuery}
              label="Consultar base"
              loadingLabel="Buscando..."
            />
          </form>
          {result && (
            <div className="mt-4">
              <ResultCard title="Resposta">{result}</ResultCard>
            </div>
          )}
        </section>
      </div>

      {items.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-sm uppercase opacity-60">
            Itens na base ({items.length})
          </h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{item.source}</p>
                <p className="text-sm opacity-70">{item.content}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
