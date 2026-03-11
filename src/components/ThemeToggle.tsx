"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

function getInitialDark() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("alda-theme");
  if (stored) return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitialDark);

  // Apply class on first render (client only)
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", dark);
  }

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("alda-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
