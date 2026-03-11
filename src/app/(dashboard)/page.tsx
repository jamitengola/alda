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
  Sparkles,
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
];

export default function DashboardPage() {
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
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">ALDA</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">⌘K buscar · ⌘⇧A toggle</p>
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
      </div>
    </div>
  );
}
