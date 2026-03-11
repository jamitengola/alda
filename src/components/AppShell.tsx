"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Search,
  ShieldCheck,
  Command,
  BrainCircuit,
} from "lucide-react";
import { useElectronNav } from "@/hooks/useElectronNav";
import ProviderBadge from "@/components/ProviderBadge";
import ThemeToggle from "@/components/ThemeToggle";
import Spotlight from "@/components/Spotlight";
import ToastContainer from "@/components/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useElectronNav();

  const pathname = usePathname();
  const isOverlay = pathname === "/overlay";
  const isDashboard = pathname === "/";
  const [stealth, setStealth] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  // Detect Electron & make background transparent (DOM only, no state)
  useEffect(() => {
    if (typeof window !== "undefined" && window.alda) {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
      document.getElementById("alda-root")?.style.setProperty("background", "transparent");
    }
  }, []);

  // Stealth & Spotlight IPC listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    window.alda.onStealthMode((enabled) => setStealth(enabled));
    window.alda.onToggleSpotlight(() => setShowSpotlight((s) => !s));
  }, []);

  // Keyboard: Cmd+K for Spotlight (also works in browser)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSpotlight((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click-through: toggle Electron mouse ignore based on cursor position
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    let currentlyInteractive = false;

    const handler = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const overInteractive = el ? el.closest("[data-interactive]") !== null : false;

      if (overInteractive && !currentlyInteractive) {
        currentlyInteractive = true;
        window.alda!.setMouseIgnore(false);
      } else if (!overInteractive && currentlyInteractive) {
        currentlyInteractive = false;
        window.alda!.setMouseIgnore(true, true);
      }
    };

    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  // Overlay page — no chrome
  if (isOverlay) return <>{children}</>;

  return (
    <div
      id="alda-root"
      className="fixed inset-0 text-gray-900 dark:text-gray-100 bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20"
    >
      {isDashboard ? (
        /* Dashboard: widgets render directly on canvas */
        <div className="h-full w-full p-5 lg:p-7 pb-20">{children}</div>
      ) : (
        /* Other pages: centered glass panel */
        <div className="flex h-full w-full items-center justify-center p-4 lg:p-7 pb-20">
          <div
            data-interactive
            className="page-glass flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex shrink-0 items-center border-b border-gray-200/30 px-5 py-2.5 dark:border-white/[0.06]">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm opacity-50 transition-opacity hover:opacity-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div className="ml-auto flex items-center gap-3">
                {stealth && (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                    <ShieldCheck className="h-3 w-3" />
                    Stealth
                  </span>
                )}
                <ProviderBadge />
                <ThemeToggle />
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1 min-h-0 overflow-y-auto styled-scroll p-5 lg:p-7">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* ── Floating Dock ── */}
      <div
        data-interactive
        className="fixed bottom-4 left-1/2 z-[999] -translate-x-1/2"
      >
        <div className="dock-glass flex items-center gap-1 px-2 py-1.5">
          <Link
            href="/"
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isDashboard
                ? "bg-blue-500/20 text-blue-500"
                : "hover:bg-white/10 opacity-60 hover:opacity-100"
            }`}
            title="Dashboard"
          >
            <Home className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setShowSpotlight(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 transition-colors hover:bg-white/10 opacity-60 hover:opacity-100"
            title="Spotlight (⌘K)"
          >
            <Search className="h-4 w-4" />
            <span className="text-[10px] flex items-center gap-0.5">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          {stealth && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          )}

          <div className="mx-1 h-5 w-px bg-white/10" />

          <div className="flex h-9 items-center gap-1.5 rounded-xl px-2 opacity-30">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">ALDA</span>
          </div>
        </div>
      </div>

      {/* ── Spotlight ── */}
      {showSpotlight && <Spotlight onClose={() => setShowSpotlight(false)} />}

      <ToastContainer />
    </div>
  );
}
