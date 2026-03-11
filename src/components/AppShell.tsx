"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useElectronNav } from "@/hooks/useElectronNav";
import Sidebar from "@/components/Sidebar";
import ProviderBadge from "@/components/ProviderBadge";
import ThemeToggle from "@/components/ThemeToggle";
import ToastContainer from "@/components/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useElectronNav();

  const pathname = usePathname();
  const isOverlay = pathname === "/overlay";
  const [stealth, setStealth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.alda) {
      window.alda.onStealthMode((enabled) => setStealth(enabled));
    }
  }, []);

  // Overlay page gets no chrome — just the raw content
  if (isOverlay) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-3">
          <span className="text-sm font-medium opacity-60">
            Assistente Local de Desenvolvimento e Aprendizagem
          </span>
          <div className="flex items-center gap-3">
            {stealth && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Stealth
              </span>
            )}
            <ProviderBadge />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
