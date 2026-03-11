"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileText,
  MessageSquareReply,
  Mic,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const WIDGETS = [
  {
    href: "/assistente",
    icon: BrainCircuit,
    title: "Coaching ao Vivo",
    desc: "A IA ouve e sugere respostas, argumentos e réplicas em tempo real.",
    size: "large",
    accent: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    href: "/transcricao",
    icon: Mic,
    title: "Transcrição",
    desc: "Áudio → resumo automático",
    size: "medium",
    accent: "from-rose-500/15 to-pink-500/10",
    iconColor: "text-rose-500",
  },
  {
    href: "/preparacao",
    icon: ClipboardList,
    title: "Preparação",
    desc: "Briefing estratégico",
    size: "small",
    accent: "from-cyan-500/15 to-teal-500/10",
    iconColor: "text-cyan-500",
  },
  {
    href: "/followup",
    icon: MessageSquareReply,
    title: "Follow-up",
    desc: "E-mails pós-reunião",
    size: "small",
    accent: "from-green-500/15 to-emerald-500/10",
    iconColor: "text-green-500",
  },
  {
    href: "/estudos",
    icon: BookOpen,
    title: "Estudos",
    desc: "Plano com tarefas priorizadas",
    size: "medium",
    accent: "from-amber-500/15 to-yellow-500/10",
    iconColor: "text-amber-500",
  },
  {
    href: "/conhecimento",
    icon: FileText,
    title: "Conhecimento",
    desc: "Base RAG com busca semântica",
    size: "medium",
    accent: "from-purple-500/15 to-violet-500/10",
    iconColor: "text-purple-500",
  },
  {
    href: "/performance",
    icon: BarChart3,
    title: "Performance",
    desc: "Métricas das sessões",
    size: "small",
    accent: "from-pink-500/15 to-fuchsia-500/10",
    iconColor: "text-pink-500",
  },
];

const SIZE_MAP: Record<string, string> = {
  large: "col-span-2 row-span-2",
  medium: "col-span-2 row-span-1",
  small: "col-span-1 row-span-1",
};

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Greeting bar */}
      <div
        data-interactive
        className="widget-glass mb-4 px-5 py-3.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ALDA</h1>
            <p className="text-xs opacity-40">Assistente Local de Desenvolvimento e Aprendizagem</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] opacity-25">
          <span>⌘⇧A toggle</span>
          <span>⌘K spotlight</span>
          <span>⌘⇧S stealth</span>
        </div>
      </div>

      {/* Widgets grid */}
      <div className="grid flex-1 grid-cols-2 md:grid-cols-4 auto-rows-[130px] gap-3">
        {WIDGETS.map(({ href, icon: Icon, title, desc, size, accent, iconColor }, i) => (
          <Link
            key={href}
            href={href}
            data-interactive
            className={`widget-glass group relative overflow-hidden p-4 transition-shadow duration-300 hover:scale-[1.03] hover:shadow-2xl animate-[widget-pop_0.4s_ease-out_backwards] ${SIZE_MAP[size]}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Accent gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} mb-2`}
                >
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <h2 className={`font-semibold ${size === "large" ? "text-base" : "text-sm"} tracking-tight`}>
                  {title}
                </h2>
                {(size === "large" || size === "medium") && (
                  <p className="mt-1 text-xs opacity-40 line-clamp-2">{desc}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-60 transition-opacity">
                Abrir <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Large widget decoration */}
            {size === "large" && (
              <div className="absolute -right-6 -bottom-6 opacity-[0.03]">
                <Icon className="h-40 w-40" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
