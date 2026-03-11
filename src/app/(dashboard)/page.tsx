"use client";

import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  FileText,
  MessageSquareReply,
  Mic,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

const MODULES = [
  {
    href: "/transcricao",
    icon: Mic,
    title: "Transcrição + Resumo",
    desc: "Grave áudio ou cole texto → resumo automático com ações.",
    color: "text-rose-500",
  },
  {
    href: "/assistente",
    icon: BrainCircuit,
    title: "Assistente Tempo Real",
    desc: "Receba sugestões de resposta durante reuniões e chamadas.",
    color: "text-blue-500",
  },
  {
    href: "/estudos",
    icon: BookOpen,
    title: "Plano de Estudos",
    desc: "Defina um objetivo → tarefas priorizadas com prazos.",
    color: "text-amber-500",
  },
  {
    href: "/followup",
    icon: MessageSquareReply,
    title: "Follow-up Automático",
    desc: "Gere emails e checklists pós-reunião em segundos.",
    color: "text-green-500",
  },
  {
    href: "/conhecimento",
    icon: FileText,
    title: "Base de Conhecimento",
    desc: "Guarde e consulte o seu material de estudo com RAG.",
    color: "text-purple-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Dashboard"
        description="Selecione um módulo para começar."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border p-5 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Icon className={`mb-3 h-7 w-7 ${color}`} />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm opacity-70">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
