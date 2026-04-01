"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  MessageSquareReply,
  Mic,
  Sparkles,
  Monitor,
  TrendingUp,
  Download,
  Upload,
  Radio,
  Calendar,
  Clock,
  Target,
  ArrowRight,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    href: "/assistente",
    icon: BrainCircuit,
    title: "Coaching ao Vivo",
    desc: "Inicie uma sessão de coaching em tempo real",
    accent: "bg-blue-500",
    glow: "shadow-blue-500/20",
    primary: true,
  },
  {
    href: "/preparacao",
    icon: ClipboardList,
    title: "Preparar Reunião",
    desc: "Gere um briefing estratégico",
    accent: "bg-cyan-500",
    glow: "shadow-cyan-500/20",
    primary: false,
  },
  {
    href: "/transcricao",
    icon: Mic,
    title: "Transcrição",
    desc: "Resuma uma reunião ou apresentação",
    accent: "bg-rose-500",
    glow: "shadow-rose-500/20",
    primary: false,
  },
  {
    href: "/followup",
    icon: MessageSquareReply,
    title: "Follow-up",
    desc: "Gere comunicação pós-reunião",
    accent: "bg-green-500",
    glow: "shadow-green-500/20",
    primary: false,
  },
  {
    href: "/performance",
    icon: BarChart3,
    title: "Performance",
    desc: "Veja suas métricas de coaching",
    accent: "bg-pink-500",
    glow: "shadow-pink-500/20",
    primary: false,
  },
];

// Map known bundle IDs to friendly context hints
const APP_CONTEXT: Record<string, { label: string; hint: string }> = {
  "us.zoom.xos": { label: "Zoom", hint: "Ativar coaching ao vivo" },
  "com.microsoft.teams2": { label: "Teams", hint: "Ativar coaching ao vivo" },
  "com.apple.iWork.Keynote": { label: "Keynote", hint: "Preparar a apresentação" },
  "com.microsoft.Powerpoint": { label: "PowerPoint", hint: "Preparar a apresentação" },
  "com.microsoft.Outlook": { label: "Outlook", hint: "Gerar follow-up" },
  "com.apple.mail": { label: "Mail", hint: "Gerar follow-up" },
  "com.tinyspeck.slackmacgap": { label: "Slack", hint: "Preparar resposta" },
  "com.google.Chrome": { label: "Chrome", hint: "" },
  "com.apple.Safari": { label: "Safari", hint: "" },
  "com.apple.finder": { label: "Finder", hint: "" },
};

export default function DashboardPage() {
  const [activeApp, setActiveApp] = useState<{ name: string; bundleId: string } | null>(null);
  const [stats, setStats] = useState<{
    counts: {
      transcriptions: number;
      coaching: number;
      followups: number;
      knowledge: number;
      study_tasks: number;
      study_completed: number;
      total_coaching_time: number;
    };
    dailyActivity: { date: string; total: number }[];
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    window.alda.onActiveAppChanged((info) => setActiveApp(info));
  }, []);

  useEffect(() => {
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const ctx = activeApp ? APP_CONTEXT[activeApp.bundleId] : null;
  const appLabel = ctx?.label || activeApp?.name || null;

  const totalItems = stats
    ? stats.counts.transcriptions + stats.counts.coaching + stats.counts.followups
    : 0;
  const maxDaily = stats ? Math.max(...stats.dailyActivity.map((d) => d.total), 1) : 1;

  // Day labels for the last 7 days
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3) };
  });

  const handleExport = async () => {
    const res = await fetch("/api/sync");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alda-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStats(null);
        fetch("/api/dashboard-stats").then((r) => r.json()).then(setStats);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex items-end justify-end pb-14 pr-2">
      <div
        data-interactive
        className="flex flex-col gap-2 w-[320px]"
      >
        {/* Header chip */}
        <div className="widget-compact flex items-center gap-2.5 px-3.5 py-2.5 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white">ALDA</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Coach de IA para reuniões</p>
          </div>
          {appLabel && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
              <Monitor className="h-2.5 w-2.5" />
              {appLabel}
            </span>
          )}
        </div>

        {/* ── Hero CTA: Start Coaching ── */}
        <Link
          href="/assistente"
          data-interactive
          className="widget-compact group flex items-center gap-3 px-4 py-3.5 hover:shadow-lg shadow-blue-500/20 border-blue-500/20 animate-[widget-pop_0.3s_ease-out_backwards]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Iniciar Coaching</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {ctx?.hint || "Sugestões de IA em tempo real"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 opacity-30 group-hover:opacity-70 transition-opacity" />
        </Link>

        {/* ── Quick actions grid ── */}
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.filter(a => !a.primary).map(({ href, icon: Icon, title, accent, glow }, i) => (
            <Link
              key={href}
              href={href}
              data-interactive
              className={`widget-compact group flex items-center gap-2.5 px-3 py-2.5 hover:shadow-lg ${glow} animate-[widget-pop_0.3s_ease-out_backwards]`}
              style={{ animationDelay: `${(i + 1) * 40}ms` }}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {title}
              </span>
            </Link>
          ))}
        </div>

        {/* ── Coaching Stats ── */}
        {stats && (
          <div className="widget-compact px-3.5 py-2.5 mt-1 animate-[widget-pop_0.3s_ease-out_backwards]" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-semibold opacity-60">Coaching · 7 dias</span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-500">{stats.counts.coaching}</p>
                <p className="text-[8px] opacity-40">SESSÕES</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-cyan-500">
                  {stats.counts.total_coaching_time > 0
                    ? `${Math.round(stats.counts.total_coaching_time / 60)}m`
                    : "0m"}
                </p>
                <p className="text-[8px] opacity-40">TEMPO</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{stats.counts.followups}</p>
                <p className="text-[8px] opacity-40">FOLLOW-UPS</p>
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-8 mb-2">
              {dayLabels.map(({ key, label }) => {
                const day = stats.dailyActivity.find((d) => d.date === key);
                const count = day?.total ?? 0;
                const pct = count > 0 ? Math.max((count / maxDaily) * 100, 10) : 4;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-0.5" title={`${label}: ${count}`}>
                    <div
                      className={`w-full rounded-sm transition-all ${count > 0 ? "bg-blue-500/70" : "bg-white/5"}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[7px] opacity-30">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Backup / Restore ── */}
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={handleExport}
            data-interactive
            className="widget-compact flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] opacity-40 hover:opacity-80 transition-opacity"
          >
            <Download className="h-3 w-3" />
            Backup
          </button>
          <button
            onClick={handleImport}
            data-interactive
            className="widget-compact flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] opacity-40 hover:opacity-80 transition-opacity"
          >
            <Upload className="h-3 w-3" />
            Restaurar
          </button>
        </div>
      </div>
    </div>
  );
}
