"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, MessageSquare, Zap, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Skeleton from "@/components/Skeleton";

interface Session {
  id: number;
  duration: number;
  word_count: number;
  suggestions_used: number;
  mode: string;
  topic: string;
  created_at: string;
}

interface Stats {
  total_sessions: number;
  total_duration: number;
  total_words: number;
  total_suggestions: number;
  avg_duration: number;
  avg_words: number;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

const MODE_LABELS: Record<string, string> = {
  coaching: "Coaching",
  objection: "Objeções",
  question: "Perguntas",
};

export default function PerformancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d: { stats: Stats; sessions: Session[] }) => {
        setStats(d.stats);
        setSessions(d.sessions);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Performance" description="Carregando..." />
        <Skeleton lines={8} />
      </div>
    );
  }

  const statCards = [
    {
      label: "Sessões",
      value: stats?.total_sessions ?? 0,
      icon: BarChart3,
      color: "text-blue-500",
    },
    {
      label: "Tempo total",
      value: formatDuration(stats?.total_duration ?? 0),
      icon: Clock,
      color: "text-green-500",
    },
    {
      label: "Palavras",
      value: stats?.total_words ?? 0,
      icon: MessageSquare,
      color: "text-purple-500",
    },
    {
      label: "Sugestões usadas",
      value: stats?.total_suggestions ?? 0,
      icon: Zap,
      color: "text-amber-500",
    },
    {
      label: "Média (duração)",
      value: formatDuration(Math.round(stats?.avg_duration ?? 0)),
      icon: TrendingUp,
      color: "text-cyan-500",
    },
    {
      label: "Média (palavras)",
      value: Math.round(stats?.avg_words ?? 0),
      icon: MessageSquare,
      color: "text-pink-500",
    },
  ];

  // Simple bar chart: word_count per session (last 10)
  const chartSessions = [...sessions].reverse().slice(-10);
  const maxWords = Math.max(...chartSessions.map((s) => s.word_count), 1);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Performance"
        description="Acompanhe seu desempenho nas sessões de coaching e veja sua evolução."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-xs uppercase font-medium opacity-60">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Simple bar chart */}
      {chartSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase opacity-60">
            Palavras por sessão (últ. 10)
          </h2>
          <div className="flex items-end gap-2 h-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            {chartSessions.map((s) => {
              const pct = Math.max((s.word_count / maxWords) * 100, 4);
              return (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] opacity-60">{s.word_count}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Session list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase opacity-60">
          Histórico de sessões
        </h2>
        {sessions.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-600 italic text-sm">
            Nenhuma sessão registrada. Use o Coaching em Tempo Real e salve uma sessão.
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.mode === "coaching"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : s.mode === "objection"
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                        : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {MODE_LABELS[s.mode] ?? s.mode}
                  </span>
                  <span className="truncate max-w-[200px] opacity-80">{s.topic || "—"}</span>
                </div>
                <div className="flex items-center gap-4 opacity-60">
                  <span>{formatDuration(s.duration)}</span>
                  <span>{s.word_count} pal.</span>
                  <span>{s.suggestions_used} sug.</span>
                  <span>{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
