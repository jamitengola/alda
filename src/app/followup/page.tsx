"use client";

import { FormEvent, useState, useEffect, useCallback } from "react";
import { Copy, Mail, Download, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import { toast } from "@/components/Toast";

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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Follow-up Automático"
        description="Gere um email ou checklist profissional após uma reunião ou formação."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-4 focus:border-blue-400 focus:outline-none"
          rows={6}
          placeholder="Resumo da reunião ou formação para gerar follow-up..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
        <LoadingButton loading={loading} label="Gerar follow-up" loadingLabel="Gerando..." />
      </form>

      {followup && (
        <div className="mt-6 space-y-3">
          <ResultCard title="Follow-up gerado">{followup}</ResultCard>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={() => onDownload(followup)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </button>
            <button
              onClick={onEmail}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Mail className="h-3.5 w-3.5" />
              Abrir no email
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase opacity-60">
            <Clock className="h-4 w-4" />
            Histórico ({history.length})
          </h2>
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs opacity-50 mb-1">
                      {new Date(item.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      <span className="text-blue-500">{item.provider}</span>
                    </p>
                    <p className="text-sm line-clamp-2 opacity-80">{item.context}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setFollowup(item.followup);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
                      title="Ver follow-up"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => onDownload(item.followup, `followup-${item.id}.md`)}
                      className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
