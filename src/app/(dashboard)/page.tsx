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

const MODULES = [
  {
    href: "/assistente",
    icon: BrainCircuit,
    title: "Coaching em Tempo Real",
    desc: "A IA ouve você e sugere respostas, argumentos e réplicas ao vivo durante reuniões e chamadas.",
    gradient: "card-gradient-blue",
    span: "md:col-span-2 md:row-span-2",
    featured: true,
  },
  {
    href: "/transcricao",
    icon: Mic,
    title: "Transcrição + Resumo",
    desc: "Grave áudio ou cole texto → resumo automático.",
    gradient: "card-gradient-rose",
    span: "",
    featured: false,
  },
  {
    href: "/preparacao",
    icon: ClipboardList,
    title: "Preparação de Reunião",
    desc: "Briefing estratégico com objeções antecipadas.",
    gradient: "card-gradient-cyan",
    span: "",
    featured: false,
  },
  {
    href: "/estudos",
    icon: BookOpen,
    title: "Plano de Estudos",
    desc: "Objetivo → tarefas priorizadas com prazos.",
    gradient: "card-gradient-amber",
    span: "",
    featured: false,
  },
  {
    href: "/followup",
    icon: MessageSquareReply,
    title: "Follow-up Automático",
    desc: "Emails e checklists pós-reunião em segundos.",
    gradient: "card-gradient-green",
    span: "",
    featured: false,
  },
  {
    href: "/conhecimento",
    icon: FileText,
    title: "Base de Conhecimento",
    desc: "Guarde e consulte material com busca semântica.",
    gradient: "card-gradient-purple",
    span: "md:col-span-2",
    featured: false,
  },
  {
    href: "/performance",
    icon: BarChart3,
    title: "Performance",
    desc: "Métricas e histórico das suas sessões de coaching.",
    gradient: "card-gradient-pink",
    span: "",
    featured: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-[fade-in_0.4s_ease-out]">
      {/* Hero */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-blue-500" />
            ALDA
          </h1>
          <p className="mt-1 text-sm opacity-50">
            Assistente Local de Desenvolvimento e Aprendizagem — escolha um módulo.
          </p>
        </div>
        <p className="hidden md:block text-xs opacity-30">⌘⇧A toggle · ⌘⇧S stealth · ⌘⇧O overlay</p>
      </div>

      {/* Bento grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 auto-rows-[140px]">
        {MODULES.map(({ href, icon: Icon, title, desc, gradient, span, featured }) => (
          <Link
            key={href}
            href={href}
            className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${span} ${
              featured ? `${gradient} text-white` : "border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600"
            }`}
          >
            {/* Background pattern for featured */}
            {featured && (
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20" />
                <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-white/10" />
              </div>
            )}

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <Icon className={`h-6 w-6 ${featured ? "text-white/90" : "text-blue-500"} mb-3`} />
                <h2 className={`font-semibold ${featured ? "text-lg" : "text-sm"}`}>{title}</h2>
                <p className={`mt-1 text-sm ${featured ? "text-white/70" : "opacity-50"} ${featured ? "" : "line-clamp-2"}`}>
                  {desc}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${featured ? "text-white/60" : "text-blue-500 opacity-0 group-hover:opacity-100"} transition-opacity`}>
                Entrar <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
