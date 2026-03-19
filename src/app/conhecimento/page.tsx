"use client";

import { FormEvent, useState } from "react";
import { FileText, Plus, Search, Database } from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import { toast } from "@/components/Toast";
import useDictation from "@/hooks/useDictation";

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

  useDictation((text) => setContent((prev) => prev ? `${prev} ${text}` : text));

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

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-colors";

  return (
    <div className="flex flex-col h-full gap-5 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Top: 3-column layout ─── */}
      <div className="flex flex-1 gap-5 min-h-0">
        {/* Add panel */}
        <div className="w-72 shrink-0 flex flex-col">
          <div className="mb-4">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              Conhecimento
            </h1>
            <p className="text-xs opacity-50 mt-1">Base RAG com busca semântica</p>
          </div>

          <div className="mb-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 opacity-40" />
            <h2 className="text-xs font-semibold uppercase opacity-40">Adicionar</h2>
          </div>
          <form onSubmit={onAdd} className="flex flex-1 flex-col gap-3">
            <input className={inputCls} placeholder="Fonte (ex: Aula 1 - Cloud)" value={source} onChange={(e) => setSource(e.target.value)} />
            <textarea
              className={`${inputCls} flex-1 min-h-[100px] resize-none`}
              placeholder="Conteúdo-chave para memorizar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <LoadingButton loading={loadingAdd} label="Adicionar" loadingLabel="Guardando..." disabled={!source.trim() || !content.trim()} />
          </form>
        </div>

        {/* Query panel */}
        <div className="w-72 shrink-0 flex flex-col">
          <div className="mb-4 h-[52px]" /> {/* spacer to align */}
          <div className="mb-3 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 opacity-40" />
            <h2 className="text-xs font-semibold uppercase opacity-40">Consultar</h2>
          </div>
          <form onSubmit={onQuery} className="space-y-3">
            <input className={inputCls} placeholder="Pergunte sobre seu material..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <LoadingButton loading={loadingQuery} label="Consultar base" loadingLabel="Buscando..." />
          </form>
          {result && (
            <div className="mt-4 flex-1 overflow-y-auto styled-scroll">
              <ResultCard title="Resposta">{result}</ResultCard>
            </div>
          )}
        </div>

        {/* Items list (expands) */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 h-[52px]" />
          <div className="mb-3 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 opacity-40" />
            <h2 className="text-xs font-semibold uppercase opacity-40">
              Base {items.length > 0 ? `(${items.length})` : ""}
            </h2>
          </div>
          {items.length === 0 ? (
            <div className="flex-1 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-[200px]">
                Adicione conteúdo à esquerda para popular sua base de conhecimento.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto styled-scroll space-y-2 pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 hover:border-purple-400/50 transition-colors"
                >
                  <p className="text-xs font-medium text-purple-500 mb-1">{item.source}</p>
                  <p className="text-sm opacity-70 line-clamp-3">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
