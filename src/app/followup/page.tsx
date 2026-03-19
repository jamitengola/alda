"use client";

import { FormEvent, useState, useEffect, useCallback } from "react";
import { Copy, Mail, Download, Clock, MessageSquareReply, Send } from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import ExportButtons from "@/components/ExportButtons";
import { toast } from "@/components/Toast";
import useDictation from "@/hooks/useDictation";

type HistoryItem = {
  id: number;
  context: string;
  followup: string;
  provider: string;
  created_at: string;
};

export default function FollowupPage() {
  const [context, setContext] = useState("");
  const [followup, setFollowup] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useDictation((text) => setContext((prev) => prev ? `${prev} ${text}` : text));

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/follow-up");
      const data = (await res.json()) as { items: HistoryItem[] };
      setHistory(data.items || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = (await res.json()) as { followup: string };
      setFollowup(data.followup);
      toast("Follow-up gerado!");
      loadHistory();
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    await navigator.clipboard.writeText(followup);
    setCopied(true);
    toast("Copiado para o clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  function onEmail() {
    const subject = encodeURIComponent("Follow-up da sessão");
    const body = encodeURIComponent(followup);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function onDownload(text: string, filename?: string) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `followup-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Ficheiro descarregado!");
  }

  return (
    <div className="flex flex-col h-full gap-5 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Top: Input + Result side by side ─── */}
      <div className="flex flex-1 gap-5 min-h-0">
        {/* Left: Form */}
        <div className="w-96 shrink-0 flex flex-col">
          <div className="mb-4">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <MessageSquareReply className="h-5 w-5 text-green-500" />
              Follow-up
            </h1>
            <p className="text-xs opacity-50 mt-1">Email ou checklist pós-reunião</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3">
            <textarea
              className="flex-1 min-h-[120px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-4 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none resize-none transition-colors"
              placeholder="Resumo da reunião ou formação para gerar follow-up..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            <LoadingButton loading={loading} label="Gerar follow-up" loadingLabel="Gerando..." />
          </form>
        </div>

        {/* Right: Result */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-semibold uppercase opacity-60">Resultado</h2>
            <div className="ml-auto">
              <ExportButtons title="Follow-up" content={followup} filename="alda-followup" />
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll">
            {followup ? (
              <ResultCard>{followup}</ResultCard>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-[200px]">
                  O follow-up gerado aparecerá aqui.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {followup && (
            <div className="mt-3 flex gap-2">
              <button onClick={onCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <button onClick={() => onDownload(followup)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Download className="h-3 w-3" />
                .md
              </button>
              <button onClick={onEmail}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Mail className="h-3 w-3" />
                Email
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ─── Bottom: History bar ─── */}
      {history.length > 0 && (
        <section className="shrink-0">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 opacity-40" />
            <h2 className="text-xs font-semibold uppercase opacity-40">Histórico ({history.length})</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 styled-scroll">
            {history.map((item) => (
              <div
                key={item.id}
                className="shrink-0 w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 hover:border-blue-400/50 transition-colors cursor-pointer group"
                onClick={() => {
                  setFollowup(item.followup);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <p className="text-[10px] opacity-40 mb-1">
                  {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  <span className="text-blue-500">{item.provider}</span>
                </p>
                <p className="text-xs line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">{item.context}</p>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(item.followup, `followup-${item.id}.md`); }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Download"
                  >
                    <Download className="h-3 w-3 opacity-40" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
