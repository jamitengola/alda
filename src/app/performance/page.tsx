"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, MessageSquare, Zap, TrendingUp, Activity } from "lucide-react";
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

const MODE_COLORS: Record<string, string> = {
  coaching: "bg-blue-500",
  objection: "bg-amber-500",
  question: "bg-purple-500",
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
      <div className="p-8">
        <Skeleton lines={8} />
      </div>
    );
  }

  const statCards = [
    { label: "Sessões", value: stats?.total_sessions ?? 0, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Tempo total", value: formatDuration(stats?.total_duration ?? 0), icon: Clock, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Palavras", value: stats?.total_words ?? 0, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Sugestões", value: stats?.total_suggestions ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Média duração", value: formatDuration(Math.round(stats?.avg_duration ?? 0)), icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Média palavras", value: Math.round(stats?.avg_words ?? 0), icon: Activity, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  const chartSessions = [...sessions].reverse().slice(-15);
  const maxWords = Math.max(...chartSessions.map((s) => s.word_count), 1);

  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
          <BarChart3 className="h-5 w-5 text-pink-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Performance</h1>
          <p className="text-xs opacity-40">Evolução e métricas das suas sessões</p>
        </div>
      </div>

      {/* Stats — spread horizontally */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight truncate">{value}</p>
              <p className="text-[10px] uppercase font-medium opacity-40 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: chart + history */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Chart — takes 3 cols */}
        <section className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase opacity-50">
            Palavras por sessão (últ. 15)
          </h2>
          {chartSessions.length > 0 ? (
            <div className="flex items-end gap-1.5 h-44">
              {chartSessions.map((s) => {
                const pct = Math.max((s.word_count / maxWords) * 100, 3);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] opacity-0 group-hover:opacity-60 transition-opacity">{s.word_count}</span>
                    <div
                      className={`w-full rounded-t transition-all group-hover:opacity-100 opacity-70 ${MODE_COLORS[s.mode] ?? "bg-blue-500"}`}
                      style={{ height: `${pct}%` }}
                      title={`${MODE_LABELS[s.mode] ?? s.mode} · ${s.word_count} palavras`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm italic opacity-40 text-center py-12">Sem dados ainda</p>
          )}
          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] opacity-40">
            {Object.entries(MODE_LABELS).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${MODE_COLORS[key]}`} />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* History — takes 2 cols */}
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 max-h-[400px] overflow-y-auto styled-scroll">
          <h2 className="mb-4 text-xs font-semibold uppercase opacity-50">
            Histórico
          </h2>
          {sessions.length === 0 ? (
            <p className="text-sm italic opacity-40 text-center py-8">
              Salve uma sessão no Coaching para ver aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${MODE_COLORS[s.mode] ?? "bg-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.topic || "Sessão sem título"}</p>
                    <p className="text-[11px] opacity-40">
                      {formatDuration(s.duration)} · {s.word_count} pal · {s.suggestions_used} sug
                    </p>
                  </div>
                  <span className="text-[10px] opacity-30 shrink-0">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
