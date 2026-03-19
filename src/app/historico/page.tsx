"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Search, BrainCircuit, Mic, MessageSquareReply, Filter, X, FileText } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import ResultCard from "@/components/ResultCard";

type TimelineItem = {
  id: string;
  type: "coaching" | "transcription" | "followup";
  title: string;
  preview: string;
  meta: string;
  created_at: string;
};

type FilterType = "all" | "coaching" | "transcription" | "followup";

const TYPE_CONFIG = {
  coaching: { label: "Coaching", icon: BrainCircuit, color: "text-blue-500", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  transcription: { label: "Transcrição", icon: Mic, color: "text-rose-500", bg: "bg-rose-500/10", dot: "bg-rose-500" },
  followup: { label: "Follow-up", icon: MessageSquareReply, color: "text-green-500", bg: "bg-green-500/10", dot: "bg-green-500" },
};

export default function HistoricoPage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailType, setDetailType] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchItems = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/history?q=${encodeURIComponent(q)}` : "/api/history";
      const res = await fetch(url);
      const data = (await res.json()) as { items: TimelineItem[] };
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems(search || undefined);
  }

  async function openDetail(id: string, type: string) {
    setLoadingDetail(true);
    setDetailType(type);
    try {
      const res = await fetch(`/api/history?id=${id}&type=${type}`);
      const data = (await res.json()) as { item: Record<string, unknown> };
      setDetail(data.item);
    } finally {
      setLoadingDetail(false);
    }
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const filterCls = (f: FilterType) =>
    `px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
      filter === f
        ? "bg-blue-600 text-white"
        : "bg-gray-100 dark:bg-gray-800 opacity-60 hover:opacity-100"
    }`;

  function renderDetail() {
    if (!detail) return null;

    if (detailType === "coaching") {
      const d = detail as { topic: string; mode: string; duration: number; word_count: number; suggestions_used: number; created_at: string };
      return (
        <div className="space-y-3">
          <h3 className="font-semibold">{d.topic || "Sessão de coaching"}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="opacity-50">Modo:</span> {d.mode}</div>
            <div><span className="opacity-50">Duração:</span> {Math.floor(d.duration / 60)}min {d.duration % 60}s</div>
            <div><span className="opacity-50">Palavras:</span> {d.word_count}</div>
            <div><span className="opacity-50">Sugestões:</span> {d.suggestions_used}</div>
          </div>
          <p className="text-xs opacity-40">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
        </div>
      );
    }

    if (detailType === "transcription") {
      const d = detail as { transcript: string; summary: string; provider: string; created_at: string };
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs uppercase font-medium opacity-50 mb-1">Resumo</h4>
            <ResultCard>{d.summary}</ResultCard>
          </div>
          <div>
            <h4 className="text-xs uppercase font-medium opacity-50 mb-1">Transcrição original</h4>
            <p className="text-sm opacity-70 whitespace-pre-wrap">{d.transcript}</p>
          </div>
          <p className="text-xs opacity-40">
            {d.provider} · {new Date(d.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      );
    }

    if (detailType === "followup") {
      const d = detail as { context: string; followup: string; provider: string; created_at: string };
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs uppercase font-medium opacity-50 mb-1">Contexto</h4>
            <p className="text-sm opacity-70">{d.context}</p>
          </div>
          <div>
            <h4 className="text-xs uppercase font-medium opacity-50 mb-1">Follow-up gerado</h4>
            <ResultCard>{d.followup}</ResultCard>
          </div>
          <p className="text-xs opacity-40">
            {d.provider} · {new Date(d.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      );
    }

    return <pre className="text-xs">{JSON.stringify(detail, null, 2)}</pre>;
  }

  return (
    <div className="flex h-full gap-6 animate-[fade-in_0.4s_ease-out]">
      {/* ── Left: Timeline ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <History className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Histórico</h1>
            <p className="text-xs opacity-40">Timeline de coaching, transcrições e follow-ups</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={onSearch} className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
            <input
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 pl-10 pr-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-colors"
              placeholder="Buscar em transcrições, resumos, follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white transition-colors"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); fetchItems(); }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              Limpar
            </button>
          )}
        </form>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 opacity-30" />
          <button className={filterCls("all")} onClick={() => setFilter("all")}>Todos</button>
          <button className={filterCls("coaching")} onClick={() => setFilter("coaching")}>Coaching</button>
          <button className={filterCls("transcription")} onClick={() => setFilter("transcription")}>Transcrição</button>
          <button className={filterCls("followup")} onClick={() => setFilter("followup")}>Follow-up</button>
        </div>

        {/* Timeline */}
        {loading ? (
          <Skeleton lines={6} />
        ) : filtered.length === 0 ? (
          <div className="flex-1 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-xs">
              {search ? "Nenhum resultado encontrado." : "Nenhuma sessão registrada ainda."}
              <br />
              <span className="text-xs opacity-60 mt-1 block">
                Use o Coaching, Transcrição ou Follow-up para gerar dados.
              </span>
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto styled-scroll space-y-1 pr-1">
            {filtered.map((item) => {
              const cfg = TYPE_CONFIG[item.type];
              const Icon = cfg.icon;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => openDetail(item.id, item.type)}
                  className="w-full text-left flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 hover:border-blue-400/50 transition-colors group"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} mt-0.5`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span className="text-[10px] font-medium opacity-40 uppercase">{cfg.label}</span>
                      {item.meta && <span className="text-[10px] opacity-30">{item.meta}</span>}
                      <span className="ml-auto text-[10px] opacity-30 shrink-0">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm font-medium group-hover:text-blue-500 transition-colors truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs opacity-40 truncate mt-0.5">{item.preview}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: Detail panel ── */}
      <div className="w-[400px] shrink-0 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 opacity-40" />
            <h2 className="text-sm font-semibold uppercase opacity-60">Detalhe</h2>
          </div>
          {detail && (
            <button onClick={() => setDetail(null)} className="opacity-40 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll">
          {loadingDetail ? (
            <Skeleton lines={5} />
          ) : detail ? (
            renderDetail()
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-[180px]">
                Clique em um item da timeline para ver os detalhes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
