"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareReply,
  Mic,
  Search,
  Command,
} from "lucide-react";

const MODULES = [
  { href: "/", icon: LayoutDashboard, title: "Dashboard", desc: "Painel de widgets" },
  { href: "/assistente", icon: BrainCircuit, title: "Coaching ao Vivo", desc: "Sugestões em tempo real durante reuniões" },
  { href: "/transcricao", icon: Mic, title: "Transcrição + Resumo", desc: "Grave áudio ou cole texto" },
  { href: "/preparacao", icon: ClipboardList, title: "Preparação de Reunião", desc: "Briefing estratégico" },
  { href: "/estudos", icon: BookOpen, title: "Plano de Estudos", desc: "Tarefas priorizadas com prazos" },
  { href: "/followup", icon: MessageSquareReply, title: "Follow-up", desc: "Emails e checklists pós-reunião" },
  { href: "/conhecimento", icon: FileText, title: "Base de Conhecimento", desc: "Busca semântica RAG" },
  { href: "/performance", icon: BarChart3, title: "Performance", desc: "Métricas das sessões" },
];

interface SpotlightProps {
  onClose: () => void;
}

export default function Spotlight({ onClose }: SpotlightProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.desc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && filtered[selected]) {
      navigate(filtered[selected].href);
    }
  };

  return (
    <div
      data-interactive
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[18vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-[60px] dark:border-white/[0.06] dark:bg-[#1a1a1a]/80"
        style={{ animation: "spotlight-in 0.2s ease-out" }}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200/50 px-4 py-3 dark:border-white/[0.06]">
          <Search className="h-5 w-5 shrink-0 opacity-40" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base outline-none placeholder:opacity-40"
            placeholder="Para onde ir?"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
          />
          <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-gray-300/50 px-1.5 py-0.5 text-[10px] opacity-40 dark:border-gray-600/50">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[40vh] overflow-y-auto styled-scroll p-2">
          {filtered.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.href}
                onClick={() => navigate(mod.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  idx === selected
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100/60 dark:hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    idx === selected ? "bg-blue-500/20" : "bg-gray-200/50 dark:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{mod.title}</p>
                  <p className="text-xs opacity-50 truncate">{mod.desc}</p>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm opacity-40">Nenhum resultado</p>
          )}
        </div>
      </div>
    </div>
  );
}
