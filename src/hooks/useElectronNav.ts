"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook that listens for Electron IPC navigation events from tray menu / global shortcuts.
 * Safe to use in browser — no-ops if window.alda is not available.
 */
export function useElectronNav() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;

    window.alda.onNavigate((route: string) => {
      router.push(route);
    });
  }, [router]);
}
