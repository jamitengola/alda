"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileText,
  History,
  MessageSquareReply,
  Mic,
  Sparkles,
  Monitor,
  TrendingUp,
  Download,
  Upload,
} from "lucide-react";

const WIDGETS = [
  {
    href: "/assistente",
    icon: BrainCircuit,
    title: "Coaching",
    accent: "bg-blue-500",
    glow: "shadow-blue-500/20",
  },
  {
    href: "/transcricao",
    icon: Mic,
    title: "Transcrição",
    accent: "bg-rose-500",
    glow: "shadow-rose-500/20",
  },
  {
    href: "/preparacao",
    icon: ClipboardList,
    title: "Preparação",
    accent: "bg-cyan-500",
    glow: "shadow-cyan-500/20",
  },
  {
    href: "/estudos",
    icon: BookOpen,
    title: "Estudos",
    accent: "bg-amber-500",
    glow: "shadow-amber-500/20",
  },
  {
    href: "/followup",
    icon: MessageSquareReply,
    title: "Follow-up",
    accent: "bg-green-500",
    glow: "shadow-green-500/20",
  },
  {
    href: "/conhecimento",
    icon: FileText,
    title: "Conhecimento",
    accent: "bg-purple-500",
    glow: "shadow-purple-500/20",
  },
  {
    href: "/performance",
    icon: BarChart3,
    title: "Performance",
    accent: "bg-pink-500",
    glow: "shadow-pink-500/20",
  },
  {
    href: "/historico",
    icon: History,
    title: "Histórico",
    accent: "bg-indigo-500",
    glow: "shadow-indigo-500/20",
  },
];

// Map known bundle IDs to friendly context hints
const APP_CONTEXT: Record<string, { label: string; hint: string }> = {
  "com.microsoft.VSCode": { label: "VS Code", hint: "Coaching: peça help com código" },
  "com.apple.Safari": { label: "Safari", hint: "Transcrição: resuma a página" },
  "com.google.Chrome": { label: "Chrome", hint: "Transcrição: resuma a página" },
  "us.zoom.xos": { label: "Zoom", hint: "Coaching ao vivo disponível" },
  "com.microsoft.teams2": { label: "Teams", hint: "Coaching ao vivo disponível" },
  "com.apple.MobileSMS": { label: "Mensagens", hint: "Follow-up: gere resposta" },
  "com.microsoft.Outlook": { label: "Outlook", hint: "Follow-up: gere resposta" },
  "com.apple.mail": { label: "Mail", hint: "Follow-up: gere resposta" },
  "com.tinyspeck.slackmacgap": { label: "Slack", hint: "Coaching: prepare resposta" },
  "com.apple.dt.Xcode": { label: "Xcode", hint: "Coaching: peça help com código" },
  "com.apple.iWork.Keynote": { label: "Keynote", hint: "Preparação: ensaie a apresentação" },
  "com.microsoft.Powerpoint": { label: "PowerPoint", hint: "Preparação: ensaie a apresentação" },
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
        className="flex flex-col gap-2 w-[280px]"
      >
        {/* Header chip */}
        <div className="widget-compact flex items-center gap-2.5 px-3.5 py-2.5 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white">ALDA</p>
            {appLabel ? (
              <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <Monitor className="h-2.5 w-2.5 shrink-0" />
                {appLabel}
                {ctx?.hint && <span className="opacity-60">· {ctx.hint}</span>}
              </p>
            ) : (
              <p className="text-[9px] text-gray-500 dark:text-gray-400">⌘K buscar · ⌘⇧A toggle</p>
            )}
          </div>
        </div>

        {/* Widget pills */}
        <div className="grid grid-cols-2 gap-1.5">
          {WIDGETS.map(({ href, icon: Icon, title, accent, glow }, i) => (
            <Link
              key={href}
              href={href}
              data-interactive
              className={`widget-compact group flex items-center gap-2.5 px-3 py-2.5 hover:shadow-lg ${glow} animate-[widget-pop_0.3s_ease-out_backwards]`}
              style={{ animationDelay: `${i * 40}ms` }}
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

        {/* ── Analytics mini strip ── */}
        {stats && totalItems > 0 && (
          <div className="widget-compact px-3.5 py-2.5 mt-1 animate-[widget-pop_0.3s_ease-out_backwards]" style={{ animationDelay: "350ms" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[10px] font-semibold opacity-60">Atividade · 7 dias</span>
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
                      className={`w-full rounded-sm transition-all ${count > 0 ? "bg-green-500/70" : "bg-white/5"}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[7px] opacity-30">{label}</span>
                  </div>
                );
              })}
            </div>
            {/* Quick counts */}
            <div className="flex items-center gap-3 text-[9px] opacity-50">
              <span>{stats.counts.coaching} sessões</span>
              <span>{stats.counts.transcriptions} transcrições</span>
              <span>{stats.counts.followups} follow-ups</span>
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
