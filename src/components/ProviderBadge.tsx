"use client";

import { useEffect, useState } from "react";

type ProviderStatus = {
  provider: "mock" | "ollama" | "openai";
  ollamaRemote: boolean;
  needsApiKeyWarning: boolean;
};

const COLOR_MAP: Record<string, string> = {
  mock: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
  ollama: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  openai: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function ProviderBadge() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    fetch("/api/provider-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStatus(data as ProviderStatus));
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_MAP[status.provider] ?? ""}`}
      >
        {status.provider}
      </span>
      {status.needsApiKeyWarning && (
        <span className="text-xs text-amber-600">⚠ API key em falta</span>
      )}
    </div>
  );
}
