"use client";

import { useEffect, useRef } from "react";

/**
 * Hook that listens for global dictation events dispatched from the Dock mic button.
 * When text is received, calls `onText` with the transcribed string.
 * The consumer can decide which field to inject it into.
 */
export default function useDictation(onText: (text: string) => void) {
  const callbackRef = useRef(onText);
  callbackRef.current = onText;

  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      if (text) callbackRef.current(text);
    };
    window.addEventListener("alda-dictation", handler);
    return () => window.removeEventListener("alda-dictation", handler);
  }, []);
}
