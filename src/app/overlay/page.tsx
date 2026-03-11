"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";

export default function OverlayPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for answers from main window via IPC
  useEffect(() => {
    if (typeof window !== "undefined" && window.alda) {
      window.alda.onOverlayAnswer((ans: string) => {
        setAnswer(ans);
        setLoading(false);
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    // Try IPC first (Electron), fallback to direct API call (browser)
    if (typeof window !== "undefined" && window.alda?.sendOverlayQuestion) {
      window.alda.sendOverlayQuestion(question);
    } else {
      try {
        const res = await fetch("/api/realtime-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: question }),
        });
        const data = await res.json();
        setAnswer(data.suggestion || "Sem resposta");
      } catch {
        setAnswer("Erro ao consultar o assistente.");
      }
      setLoading(false);
    }
  }

  function handleClose() {
    if (typeof window !== "undefined" && window.alda?.closeOverlay) {
      window.alda.closeOverlay();
    }
  }

  return (
    <div className="h-screen w-screen select-none" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="h-full w-full rounded-2xl bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 text-white p-4 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
            ALDA Overlay
          </span>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-700/60 transition-colors"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <X size={14} />
          </button>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 mb-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunta rápida..."
            className="flex-1 bg-gray-800/70 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>

        {/* Answer */}
        <div
          className="flex-1 overflow-y-auto text-sm text-gray-300 leading-relaxed"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {answer ? (
            <p className="whitespace-pre-wrap">{answer}</p>
          ) : (
            <p className="text-gray-600 italic text-xs">
              Cmd+Shift+O para mostrar/esconder • Cmd+Shift+A para ALDA
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
