"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Search,
  ShieldCheck,
  Command,
  BrainCircuit,
  Mic,
  MicOff,
  Send,
  X,
  Camera,
  Copy,
  Loader2,
} from "lucide-react";
import { useElectronNav } from "@/hooks/useElectronNav";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import ProviderBadge from "@/components/ProviderBadge";
import ThemeToggle from "@/components/ThemeToggle";
import Spotlight from "@/components/Spotlight";
import ClipboardActions from "@/components/ClipboardActions";
import ProactiveNotification from "@/components/ProactiveNotification";
import ToastContainer, { toast } from "@/components/Toast";
import { formatTime } from "@/lib/utils";

// ── Proactive notification rules (bundleId → suggestion) ──
const NOTIFY_RULES: Record<string, { message: string; route: string; actionLabel: string }> = {
  "us.zoom.xos": { message: "Reunião detectada no Zoom", route: "/assistente", actionLabel: "Ativar coaching ao vivo" },
  "com.microsoft.teams2": { message: "Reunião detectada no Teams", route: "/assistente", actionLabel: "Ativar coaching ao vivo" },
  "com.apple.iWork.Keynote": { message: "Keynote aberto — hora de ensaiar?", route: "/preparacao", actionLabel: "Preparar apresentação" },
  "com.microsoft.Powerpoint": { message: "PowerPoint aberto — hora de ensaiar?", route: "/preparacao", actionLabel: "Preparar apresentação" },
  "com.microsoft.VSCode": { message: "VS Code ativo — precisa de ajuda?", route: "/assistente", actionLabel: "Coaching de código" },
  "com.apple.dt.Xcode": { message: "Xcode ativo — precisa de ajuda?", route: "/assistente", actionLabel: "Coaching de código" },
  "com.microsoft.Outlook": { message: "E-mail aberto — gerar follow-up?", route: "/followup", actionLabel: "Criar follow-up" },
  "com.apple.mail": { message: "Mail aberto — gerar follow-up?", route: "/followup", actionLabel: "Criar follow-up" },
  "com.tinyspeck.slackmacgap": { message: "Slack ativo — resposta inteligente?", route: "/followup", actionLabel: "Gerar resposta" },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  useElectronNav();

  const pathname = usePathname();
  const isOverlay = pathname === "/overlay";
  const isDashboard = pathname === "/";
  const [stealth, setStealth] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isElectron, setIsElectron] = useState(false);
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const clipboardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Proactive notifications ──
  const [proactiveNotif, setProactiveNotif] = useState<{
    message: string;
    route: string;
    actionLabel: string;
  } | null>(null);
  const lastNotifiedBundle = useRef<string>("");
  const notifCooldowns = useRef<Record<string, number>>({});

  // ── Screenshot OCR ──
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "capturing" | "processing">("idle");

  // ── Global dictation ──
  const [showDictation, setShowDictation] = useState(false);
  const speech = useSpeechRecognition("pt-BR");
  const speechRef = useRef(speech);
  speechRef.current = speech;

  const startDictation = useCallback(() => {
    setShowDictation(true);
    speech.reset();
    speech.start();
  }, [speech]);

  const stopDictation = useCallback(() => {
    speech.stop();
  }, [speech]);

  const sendDictation = useCallback(() => {
    const text = speechRef.current.transcript.trim();
    if (text) {
      window.dispatchEvent(new CustomEvent("alda-dictation", { detail: text }));
      toast("Texto inserido no campo ativo!");
    }
    speechRef.current.reset();
    setShowDictation(false);
  }, []);

  const cancelDictation = useCallback(() => {
    speech.stop();
    speech.reset();
    setShowDictation(false);
  }, [speech]);

  // Detect Electron & make background transparent
  useEffect(() => {
    if (typeof window !== "undefined" && window.alda) {
      setIsElectron(true);
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
    }
  }, []);

  // Stealth & Spotlight & UI toggle IPC listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    window.alda.onStealthMode((enabled) => setStealth(enabled));
    window.alda.onToggleSpotlight(() => setShowSpotlight((s) => !s));
    window.alda.onToggleUI(() => setUiVisible((v) => !v));
    window.alda.onClipboardTextCopied((text) => {
      setClipboardText(text);
      // Auto-dismiss after 15s
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current);
      clipboardTimer.current = setTimeout(() => setClipboardText(null), 15000);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Proactive notification on active app change ──
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    window.alda.onActiveAppChanged(({ bundleId }) => {
      // Same app as last notification — skip
      if (bundleId === lastNotifiedBundle.current) return;
      const rule = NOTIFY_RULES[bundleId];
      if (!rule) return;
      // Cooldown: 5 minutes per bundle
      const now = Date.now();
      const last = notifCooldowns.current[bundleId] || 0;
      if (now - last < 5 * 60 * 1000) return;
      notifCooldowns.current[bundleId] = now;
      lastNotifiedBundle.current = bundleId;
      setProactiveNotif(rule);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Screenshot OCR IPC listeners ──
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    window.alda.onScreenshotOCR((text) => {
      setOcrText(text);
      setOcrStatus("idle");
    });
    window.alda.onScreenshotOCRStatus((status) => setOcrStatus(status));
  }, []);

  // Keyboard: Cmd+K for Spotlight (also works in browser)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSpotlight((s) => !s);
      }
      // Cmd+Shift+H to toggle UI visibility (browser fallback)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setUiVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click-through: toggle Electron mouse ignore based on cursor position
  useEffect(() => {
    if (typeof window === "undefined" || !window.alda) return;
    let currentlyInteractive = false;

    const handler = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const overInteractive = el ? el.closest("[data-interactive]") !== null : false;

      if (overInteractive && !currentlyInteractive) {
        currentlyInteractive = true;
        window.alda!.setMouseIgnore(false);
      } else if (!overInteractive && currentlyInteractive) {
        currentlyInteractive = false;
        window.alda!.setMouseIgnore(true, true);
      }
    };

    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  // Overlay page — no chrome
  if (isOverlay) return <>{children}</>;

  // UI hidden — show only a minimal indicator pill
  if (!uiVisible) {
    return (
      <div id="alda-root" className="fixed inset-0" style={{ background: "transparent" }}>
        <div
          data-interactive
          className="fixed bottom-4 right-4 z-[999]"
        >
          <button
            onClick={() => setUiVisible(true)}
            className="dock-glass flex items-center gap-1.5 px-3 py-1.5 opacity-40 hover:opacity-100 transition-opacity"
            title="Mostrar ALDA (⌘⇧H)"
          >
            <BrainCircuit className="h-3 w-3" />
            <span className="text-[9px] font-medium">⌘⇧H</span>
          </button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div
      id="alda-root"
      className={`fixed inset-0 text-gray-900 dark:text-gray-100 ${
        isElectron
          ? ""
          : "bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20"
      }`}
      style={isElectron ? { background: "transparent" } : undefined}
    >
      {isDashboard ? (
        /* Dashboard: widgets render directly on canvas */
        <div className="h-full w-full p-5 lg:p-7 pb-20">{children}</div>
      ) : (
        /* Other pages: centered glass panel */
        <div className="flex h-full w-full items-center justify-center p-4 lg:p-7 pb-20">
          <div
            data-interactive
            className="page-glass flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex shrink-0 items-center border-b border-gray-200/30 px-5 py-2.5 dark:border-white/[0.06]">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm opacity-50 transition-opacity hover:opacity-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div className="ml-auto flex items-center gap-3">
                {stealth && (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                    <ShieldCheck className="h-3 w-3" />
                    Stealth
                  </span>
                )}
                <ProviderBadge />
                <ThemeToggle />
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1 min-h-0 overflow-y-auto styled-scroll p-5 lg:p-7">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* ── Floating Dock ── */}
      <div
        data-interactive
        className="fixed bottom-4 left-1/2 z-[999] -translate-x-1/2"
      >
        <div className="dock-glass flex items-center gap-1 px-2 py-1.5">
          <Link
            href="/"
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              isDashboard
                ? "bg-blue-500/20 text-blue-500"
                : "hover:bg-white/10 opacity-60 hover:opacity-100"
            }`}
            title="Dashboard"
          >
            <Home className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setShowSpotlight(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 transition-colors hover:bg-white/10 opacity-60 hover:opacity-100"
            title="Spotlight (⌘K)"
          >
            <Search className="h-4 w-4" />
            <span className="text-[10px] flex items-center gap-0.5">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          <button
            onClick={showDictation ? stopDictation : startDictation}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              showDictation && speech.isListening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "hover:bg-white/10 opacity-60 hover:opacity-100"
            }`}
            title="Ditado por voz"
          >
            {showDictation && speech.isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              ocrStatus !== "idle"
                ? "bg-cyan-500/20 text-cyan-400 animate-pulse"
                : "opacity-40"
            }`}
            title="Screenshot OCR (⌘⇧P)"
          >
            {ocrStatus === "processing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </div>

          {stealth && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          )}

          <div className="mx-1 h-5 w-px bg-white/10" />

          <div className="flex h-9 items-center gap-1.5 rounded-xl px-2 opacity-30">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">ALDA</span>
          </div>
        </div>
      </div>

      {/* ── Dictation Widget (above Dock) ── */}
      {showDictation && (
        <div
          data-interactive
          className="fixed bottom-[70px] left-1/2 z-[999] -translate-x-1/2 w-[420px]"
        >
          <div className="dock-glass p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {speech.isListening ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                )}
                <span className="text-xs font-medium opacity-60">
                  {speech.isListening ? `Gravando ${formatTime(speech.elapsed)}` : "Pausado"}
                </span>
              </div>
              <button onClick={cancelDictation} className="opacity-40 hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-lg bg-black/20 p-3 min-h-[60px] max-h-[120px] overflow-y-auto styled-scroll mb-3">
              <p className="text-sm">
                {speech.transcript || <span className="opacity-30 italic">Fale algo...</span>}
                {speech.interimText && (
                  <span className="opacity-40"> {speech.interimText}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={speech.isListening ? stopDictation : () => speech.start()}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  speech.isListening
                    ? "bg-red-500/80 text-white hover:bg-red-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {speech.isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {speech.isListening ? "Parar" : "Continuar"}
              </button>
              <button
                onClick={sendDictation}
                disabled={!speech.transcript.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <Send className="h-3 w-3" />
                Inserir no campo
              </button>
              {speech.error && (
                <span className="text-[10px] text-red-400 ml-auto">{speech.error}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Spotlight ── */}
      {showSpotlight && <Spotlight onClose={() => setShowSpotlight(false)} />}

      {/* ── Clipboard Actions popup ── */}
      {clipboardText && (
        <ClipboardActions text={clipboardText} onClose={() => setClipboardText(null)} />
      )}

      {/* ── Proactive Notification ── */}
      {proactiveNotif && (
        <ProactiveNotification
          message={proactiveNotif.message}
          route={proactiveNotif.route}
          actionLabel={proactiveNotif.actionLabel}
          onDismiss={() => setProactiveNotif(null)}
        />
      )}

      {/* ── Screenshot OCR Result Panel ── */}
      {ocrText && (
        <div
          data-interactive
          className="fixed top-6 left-1/2 z-[999] -translate-x-1/2 w-[480px] max-w-[90vw]"
        >
          <div className="dock-glass p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold">Texto extraído (OCR)</span>
              </div>
              <button onClick={() => setOcrText(null)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="rounded-lg bg-black/20 p-3 max-h-[200px] overflow-y-auto styled-scroll mb-3">
              <p className="text-sm whitespace-pre-wrap">{ocrText}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ocrText);
                  toast("Texto copiado!");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("alda-dictation", { detail: ocrText }));
                  toast("Texto inserido no campo ativo!");
                  setOcrText(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <Send className="h-3 w-3" />
                Inserir no campo
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
