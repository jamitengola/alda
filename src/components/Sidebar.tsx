"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  MessageSquareReply,
  Mic,
  History,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistente", label: "Coaching ao Vivo", icon: BrainCircuit },
  { href: "/preparacao", label: "Preparação", icon: ClipboardList },
  { href: "/transcricao", label: "Transcrição", icon: Mic },
  { href: "/followup", label: "Follow-up", icon: MessageSquareReply },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/historico", label: "Histórico", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <BrainCircuit className="h-6 w-6 text-blue-600" />
        <div>
          <span className="text-lg font-bold tracking-tight">ALDA</span>
          <p className="text-[9px] text-zinc-400 -mt-0.5">Coach de Reuniões</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-5 py-3 text-xs opacity-50">
        ALDA v1.0 · Coaching
      </div>
    </aside>
  );
}
