"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Zap,
  ShieldCheck,
  HelpCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ResultCard from "@/components/ResultCard";
import Skeleton from "@/components/Skeleton";
import { toast } from "@/components/Toast";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

type CoachingMode = "coaching" | "objection" | "question";

const MODES: { key: CoachingMode; label: string; icon: typeof Zap; color: string }[] = [
  { key: "coaching", label: "Coaching", icon: Zap, color: "bg-blue-600" },
  { key: "objection", label: "Objeções", icon: ShieldCheck, color: "bg-amber-600" },
  { key: "question", label: "Perguntas", icon: HelpCircle, color: "bg-purple-600" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AssistentePage() {
  const [mode, setMode] = useState<CoachingMode>("coaching");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [suggestionsCount, setSuggestionsCount] = useState(0);
  const lastProcessed = useRef("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speech = useSpeechRecognition("pt-BR");

  const fullTranscript =
    speech.transcript + (speech.interimText ? ` ${speech.interimText}` : "");

  // Count words
  useEffect(() => {
    const words = speech.transcript.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [speech.transcript]);

  // Auto-coaching: fetch suggestion every time transcript grows significantly
  const fetchSuggestion = useCallback(
    async (text: string) => {
      if (!text.trim() || text === lastProcessed.current) return;
      lastProcessed.current = text;
      setLoading(true);

      try {
        const res = await fetch("/api/live-coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text.slice(-500), mode }),
        });
        const data = (await res.json()) as { suggestion: string };
        setSuggestion(data.suggestion);
        setSuggestionsCount((c) => c + 1);
      } catch {
        setSuggestion("Erro ao obter sugestão. Verifique a conexão com o modelo.");
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  // Debounced auto-fetch when transcript changes (every 4 seconds of new speech)
  useEffect(() => {
    if (!autoMode || !speech.isListening) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Only trigger if we have at least 15 new characters since last suggestion
      const newText = speech.transcript;
      if (newText.length - lastProcessed.current.length > 15) {
        fetchSuggestion(newText);
      }
    }, 4000);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [speech.transcript, speech.isListening, autoMode, fetchSuggestion]);

  // Manual trigger
  function handleManualSuggestion() {
    fetchSuggestion(speech.transcript || "");
  }

  // Save session stats
  async function saveSession() {
    try {
      await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: speech.elapsed,
          wordCount,
          suggestionsUsed: suggestionsCount,
          mode,
          topic: speech.transcript.slice(0, 100),
        }),
      });
      toast("Sessão salva nas métricas!");
    } catch {
      toast("Erro ao salvar sessão", "error");
    }
  }

  function handleReset() {
    speech.reset();
    setSuggestion("");
    setWordCount(0);
    setSuggestionsCount(0);
    lastProcessed.current = "";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Coaching em Tempo Real"
        description="Ative o microfone — a IA ouve você e sugere respostas, argumentos e réplicas em tempo real."
      />

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {MODES.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === key
                ? `${color} text-white shadow-lg`
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={speech.isListening ? speech.stop : speech.start}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            speech.isListening
              ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {speech.isListening ? "Parar escuta" : "Iniciar escuta"}
        </button>

        {!speech.isListening && speech.transcript && (
          <>
            <button
              onClick={handleManualSuggestion}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Obter sugestão
            </button>
            <button
              onClick={saveSession}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar sessão
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </>
        )}

        {/* Auto toggle */}
        <label className="ml-auto flex items-center gap-2 text-sm opacity-70 cursor-pointer">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            className="accent-blue-600"
          />
          Auto-sugestão
        </label>
      </div>

      {/* Stats bar */}
      {speech.isListening && (
        <div className="flex gap-6 mb-4 text-sm opacity-60">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {formatTime(speech.elapsed)}
          </span>
          <span>{wordCount} palavras</span>
          <span>{suggestionsCount} sugestões</span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Transcript */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase opacity-60">
            Transcrição ao vivo
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 min-h-[200px] max-h-[400px] overflow-y-auto text-sm leading-relaxed">
            {fullTranscript ? (
              <p className="whitespace-pre-wrap">
                {speech.transcript}
                {speech.interimText && (
                  <span className="text-blue-400 opacity-60">{speech.interimText}</span>
                )}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-600 italic">
                {speech.isListening
                  ? "Ouvindo... comece a falar."
                  : "Clique em 'Iniciar escuta' para começar."}
              </p>
            )}
          </div>
        </section>

        {/* Suggestion */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase opacity-60 flex items-center gap-2">
            {MODES.find((m) => m.key === mode)?.icon &&
              (() => {
                const ModeIcon = MODES.find((m) => m.key === mode)!.icon;
                return <ModeIcon className="h-4 w-4" />;
              })()}
            Sugestão IA ({MODES.find((m) => m.key === mode)?.label})
          </h2>
          {loading ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 min-h-[200px]">
              <Skeleton lines={4} />
            </div>
          ) : suggestion ? (
            <ResultCard>{suggestion}</ResultCard>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 min-h-[200px] flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-600 italic text-sm text-center">
                As sugestões aparecerão aqui enquanto você fala.
                <br />
                <span className="text-xs">
                  {autoMode
                    ? "Modo automático ativo — sugestões a cada 4s de fala."
                    : "Modo manual — clique em 'Obter sugestão'."}
                </span>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
