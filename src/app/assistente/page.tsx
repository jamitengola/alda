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
  Radio,
  AlertCircle,
  Target,
  Presentation,
  Handshake,
} from "lucide-react";
import ResultCard from "@/components/ResultCard";
import Skeleton from "@/components/Skeleton";
import { toast } from "@/components/Toast";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import { formatTime } from "@/lib/utils";

type CoachingMode = "coaching" | "objection" | "question" | "sales" | "pitch" | "negotiation";

const MODES: { key: CoachingMode; label: string; icon: typeof Zap; color: string; bg: string }[] = [
  { key: "coaching", label: "Coaching", icon: Zap, color: "text-blue-400", bg: "bg-blue-600" },
  { key: "sales", label: "Vendas", icon: Target, color: "text-emerald-400", bg: "bg-emerald-600" },
  { key: "pitch", label: "Pitch", icon: Presentation, color: "text-orange-400", bg: "bg-orange-600" },
  { key: "negotiation", label: "Negociação", icon: Handshake, color: "text-cyan-400", bg: "bg-cyan-600" },
  { key: "objection", label: "Objeções", icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-600" },
  { key: "question", label: "Perguntas", icon: HelpCircle, color: "text-purple-400", bg: "bg-purple-600" },
];

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
  const speechRef = useRef(speech);
  speechRef.current = speech;

  // Quick-record shortcut also works on coaching page — starts listening
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda?.onQuickRecord) return;
    window.alda.onQuickRecord(() => {
      if (!speechRef.current.isListening) {
        speechRef.current.start();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fullTranscript =
    speech.transcript + (speech.interimText ? ` ${speech.interimText}` : "");

  useEffect(() => {
    const words = speech.transcript.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [speech.transcript]);

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

  useEffect(() => {
    if (!autoMode || !speech.isListening) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const newText = speech.transcript;
      if (newText.length - lastProcessed.current.length > 15) {
        fetchSuggestion(newText);
      }
    }, 4000);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [speech.transcript, speech.isListening, autoMode, fetchSuggestion]);

  function handleManualSuggestion() {
    fetchSuggestion(speech.transcript || "");
  }

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

  const currentMode = MODES.find((m) => m.key === mode)!;
  const ModeIcon = currentMode.icon;

  return (
    <div className="flex h-full gap-5 animate-[fade-in_0.4s_ease-out]">
      {/* ─── Left rail: controls ─── */}
      <aside className="flex w-16 shrink-0 flex-col items-center gap-4 pt-2">
        {/* Mic button — large circular */}
        <button
          onClick={speech.isListening ? speech.stop : speech.start}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${
            speech.isListening
              ? "bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
          }`}
          title={speech.isListening ? "Parar escuta" : "Iniciar escuta"}
        >
          {speech.isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {/* Mode buttons — vertical */}
        {MODES.map(({ key, label, icon: Icon, color, bg }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            title={label}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              mode === key
                ? `${bg} text-white shadow-md`
                : `${color} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
          </button>
        ))}

        <div className="my-1 h-px w-8 bg-gray-200 dark:bg-gray-800" />

        {/* Action buttons */}
        {!speech.isListening && speech.transcript && (
          <>
            <button onClick={handleManualSuggestion} disabled={loading} title="Obter sugestão"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-800/60 disabled:opacity-40 transition-colors"
            >
              <Zap className="h-4.5 w-4.5" />
            </button>
            <button onClick={saveSession} title="Salvar sessão"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-green-600 hover:bg-green-200 dark:hover:bg-green-800/60 transition-colors"
            >
              <Save className="h-4.5 w-4.5" />
            </button>
            <button onClick={handleReset} title="Limpar"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          </>
        )}

        {/* Auto toggle */}
        <label className="mt-auto mb-2 flex flex-col items-center gap-1 cursor-pointer" title="Auto-sugestão">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            className="accent-blue-600 h-4 w-4"
          />
          <span className="text-[9px] uppercase font-medium opacity-40">Auto</span>
        </label>
      </aside>

      {/* ─── Center: Transcript (takes the most space) ─── */}
      <section className="flex flex-1 flex-col min-w-0">
        {/* Status bar */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">Coaching</h1>
            {speech.isListening && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                AO VIVO
              </span>
            )}
          </div>
          {speech.isListening && (
            <div className="flex items-center gap-5 text-xs font-mono opacity-50">
              <span>{formatTime(speech.elapsed)}</span>
              <span>{wordCount} pal</span>
              <span>{suggestionsCount} sug</span>
            </div>
          )}
          {speech.error && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {speech.error === "not-allowed" ? "Permissão de microfone negada" : `Erro: ${speech.error}`}
            </span>
          )}
        </div>

        {/* Transcript area — fills available height */}
        <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 overflow-y-auto styled-scroll text-sm leading-relaxed">
          {fullTranscript ? (
            <p className="whitespace-pre-wrap">
              {speech.transcript}
              {speech.interimText && (
                <span className="text-blue-400 opacity-50">{speech.interimText}</span>
              )}
            </p>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic max-w-xs">
                {speech.isListening
                  ? "Ouvindo... comece a falar."
                  : "Clique no microfone à esquerda para iniciar a escuta ao vivo."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Right: AI Suggestion panel ─── */}
      <section className="flex w-80 shrink-0 flex-col lg:w-96">
        <div className="mb-3 flex items-center gap-2">
          <ModeIcon className={`h-4 w-4 ${currentMode.color}`} />
          <h2 className="text-sm font-semibold uppercase opacity-60">{currentMode.label}</h2>
        </div>

        <div className="flex-1 overflow-y-auto styled-scroll">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 h-full">
              <Skeleton lines={6} />
            </div>
          ) : suggestion ? (
            <div className={`rounded-2xl ${currentMode.bg} bg-opacity-5 border border-gray-200 dark:border-gray-800 p-5 h-full`}>
              <ResultCard>{suggestion}</ResultCard>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-5 h-full flex items-center justify-center">
              <p className="text-center text-gray-400 dark:text-gray-600 italic text-sm max-w-[200px]">
                Sugestões da IA aparecerão aqui em tempo real.
                <br />
                <span className="text-[11px] mt-2 block opacity-60">
                  {autoMode ? "Auto a cada 4s" : "Manual · clique ⚡"}
                </span>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
