"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { Mic, MicOff, RotateCcw, FileText, Keyboard, Radio, AlertCircle } from "lucide-react";
import LoadingButton from "@/components/LoadingButton";
import ResultCard from "@/components/ResultCard";
import ExportButtons from "@/components/ExportButtons";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import { toast } from "@/components/Toast";
import { formatTime } from "@/lib/utils";

export default function TranscricaoPage() {
  const [manualInput, setManualInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"type" | "record">("type");

  const speech = useSpeechRecognition("pt-BR");
  const speechRef = useRef(speech);
  speechRef.current = speech;

  // Listen for quick-record shortcut (⌘⇧R) — stable ref to avoid re-registering
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda?.onQuickRecord) return;
    window.alda.onQuickRecord(() => {
      setMode("record");
      if (!speechRef.current.isListening) {
        speechRef.current.start();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="flex h-full gap-6 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Left: Input area ─── */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">Transcrição</h1>
            {speech.isListening && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                {formatTime(speech.elapsed)}
              </span>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "type" ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              Digitar
            </button>
            <button
              type="button"
              onClick={() => setMode("record")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "record" ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              Gravar
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3">
          {mode === "type" ? (
            <textarea
              className="flex-1 min-h-[200px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 dark:text-gray-100 p-4 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none resize-none transition-colors"
              placeholder="Cole a transcrição da reunião ou aula aqui..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
          ) : (
            <div className="flex flex-1 flex-col gap-3">
              {/* Controls */}
              <div className="flex items-center gap-3">
                {!speech.isListening ? (
                  <button
                    type="button"
                    onClick={speech.start}
                    disabled={!speech.isSupported}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <Mic className="h-4 w-4" />
                    {speech.isSupported ? "Iniciar gravação" : "Não suportado"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={speech.stop}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                  >
                    <MicOff className="h-4 w-4" />
                    Parar
                  </button>
                )}
                {speech.transcript && !speech.isListening && (
                  <button
                    type="button"
                    onClick={speech.reset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                )}
                {speech.error && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {speech.error === "not-allowed" ? "Permissão de microfone negada" : `Erro: ${speech.error}`}
                  </span>
                )}
              </div>

              {/* Live transcript */}
              <div className="flex-1 min-h-[180px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 text-sm overflow-y-auto styled-scroll">
                {currentText || (
                  <span className="italic opacity-40">
                    {speech.isListening ? "A ouvir... fale agora." : "Clique em \"Iniciar gravação\"."}
                  </span>
                )}
              </div>
            </div>
          )}

          <LoadingButton loading={loading} label="Gerar resumo" loadingLabel="IA resumindo..." disabled={!currentText.trim()} />
        </form>
      </div>

      {/* ─── Right: Result ─── */}
      <section className="flex w-80 shrink-0 flex-col lg:w-[420px]">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-rose-500" />
          <h2 className="text-sm font-semibold uppercase opacity-60">Resumo</h2>
          <div className="ml-auto">
            <ExportButtons title="Resumo — Transcrição" content={summary} filename="alda-resumo" />
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll">
          {summary ? (
            <ResultCard>{summary}</ResultCard>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-[200px]">
                O resumo gerado pela IA aparecerá aqui com pontos-chave e ações.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
