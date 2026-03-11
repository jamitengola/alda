"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

export interface ToastMessage {
  id: number;
  text: string;
  type?: "success" | "error" | "info";
}

let addToastGlobal: ((text: string, type?: ToastMessage["type"]) => void) | null = null;

/** Call from anywhere to show a toast */
export function toast(text: string, type: ToastMessage["type"] = "success") {
  addToastGlobal?.(text, type);
}

const colors: Record<string, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

export default function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: ToastMessage["type"] = "success") => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  function dismiss(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`${colors[m.type || "success"]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[260px] animate-slide-up text-sm`}
        >
          <span className="flex-1">{m.text}</span>
          <button onClick={() => dismiss(m.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
