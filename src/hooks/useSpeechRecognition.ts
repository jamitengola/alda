"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Web Speech API type shims ---------- */
// The Web Speech API types are not included in lib.dom.d.ts by default.
// We declare minimal interfaces so TypeScript is happy without adding
// the full @types/dom-speech-recognition package.

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionHook = {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimText: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  elapsed: number;
  error: string | null;
};

export default function useSpeechRecognition(lang = "pt-BR"): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldRestartRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) return;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (!SpeechRecognitionAPI) return;

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errType = event.error;
      // "no-speech" and "aborted" are non-fatal — recognition auto-restarts
      if (errType === "no-speech" || errType === "aborted") return;
      setError(errType);
      shouldRestartRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      setInterimText("");
      // Auto-restart if still supposed to be listening (browser may stop after ~60s)
      if (shouldRestartRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return; // keep isListening true, keep timer going
        } catch {
          // ignore — fall through to stop
        }
      }
      setIsListening(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    setError(null);
    recognition.start();
    setIsListening(true);
    setElapsed(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, [isSupported, lang]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setElapsed(0);
    setError(null);
  }, [stop]);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { isListening, isSupported, transcript, interimText, start, stop, reset, elapsed, error };
}
