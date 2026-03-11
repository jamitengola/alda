"use client";

import { usePathname } from "next/navigation";
import { useElectronNav } from "@/hooks/useElectronNav";
import Sidebar from "@/components/Sidebar";
import ProviderBadge from "@/components/ProviderBadge";
import ThemeToggle from "@/components/ThemeToggle";
import ToastContainer from "@/components/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useElectronNav();

  const pathname = usePathname();
  const isOverlay = pathname === "/overlay";

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
