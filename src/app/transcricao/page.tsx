"use client";

import { FormEvent, useState, useEffect } from "react";
import { Mic, MicOff, RotateCcw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import { toast } from "@/components/Toast";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function TranscricaoPage() {
  const [manualInput, setManualInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"type" | "record">("type");

  const speech = useSpeechRecognition("pt-BR");

  // Listen for quick-record shortcut from Electron (Cmd+Shift+R)
  useEffect(() => {
    if (typeof window !== "undefined" && window.alda?.onQuickRecord) {
      window.alda.onQuickRecord(() => {
        setMode("record");
        if (!speech.isListening) {
          speech.start();
        }
      });
    }
  }, [speech]);

  const currentText =
    mode === "record"
      ? speech.transcript + (speech.interimText ? ` ${speech.interimText}` : "")
      : manualInput;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = mode === "record" ? speech.transcript : manualInput;
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transcribe-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = (await res.json()) as { summary: string };
      setSummary(data.summary);
      toast("Resumo gerado com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Transcrição + Resumo"
        description="Grave áudio ao vivo ou cole texto para gerar um resumo automático."
      />

      {/* Mode toggle */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("type")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "type" ? "bg-blue-600 text-white" : "border hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Digitar texto
        </button>
        <button
          type="button"
          onClick={() => setMode("record")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "record" ? "bg-blue-600 text-white" : "border hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Gravar áudio
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "type" ? (
          <textarea
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 p-4 focus:border-blue-400 focus:outline-none"
            rows={8}
            placeholder="Cole a transcrição da reunião ou aula aqui..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        ) : (
          <div className="space-y-3">
            {/* Recording controls */}
            <div className="flex items-center gap-3">
              {!speech.isListening ? (
                <button
                  type="button"
                  onClick={speech.start}
                  disabled={!speech.isSupported}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  {speech.isSupported ? "Iniciar gravação" : "Não suportado neste browser"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={speech.stop}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <MicOff className="h-4 w-4" />
                  Parar
                </button>
              )}

              {speech.isListening && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                  <span className="font-mono">{formatTime(speech.elapsed)}</span>
                </div>
              )}

              {speech.transcript && !speech.isListening && (
                <button
                  type="button"
                  onClick={speech.reset}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar
                </button>
              )}
            </div>

            {/* Live transcript */}
            <div className="min-h-[180px] rounded-lg border bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
              {currentText || (
                <span className="italic opacity-40">
                  {speech.isListening
                    ? "A ouvir... fale agora."
                    : "Clique em \"Iniciar gravação\" para começar."}
                </span>
              )}
            </div>
          </div>
        )}

        <LoadingButton
          loading={loading}
          label="Gerar resumo"
          loadingLabel="IA resumindo..."
          disabled={!currentText.trim()}
        />
      </form>

      {summary && (
        <div className="mt-6">
          <ResultCard title="Resumo gerado">{summary}</ResultCard>
        </div>
      )}
    </div>
  );
}
