"use client";

import { useState } from "react";
import { X, FileText, Languages, MessageSquareReply, Brain, Loader2 } from "lucide-react";
import { toast } from "@/components/Toast";

type ClipboardAction = "summarize" | "translate" | "followup" | "explain";

const ACTIONS: { key: ClipboardAction; label: string; icon: typeof FileText; color: string }[] = [
  { key: "summarize", label: "Resumir", icon: FileText, color: "bg-blue-500" },
  { key: "translate", label: "Traduzir", icon: Languages, color: "bg-purple-500" },
  { key: "followup", label: "Follow-up", icon: MessageSquareReply, color: "bg-green-500" },
  { key: "explain", label: "Explicar", icon: Brain, color: "bg-amber-500" },
];

export default function ClipboardActions({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [activeAction, setActiveAction] = useState<ClipboardAction | null>(null);

  const preview = text.length > 120 ? text.slice(0, 120) + "…" : text;

  async function runAction(action: ClipboardAction) {
    setLoading(true);
    setActiveAction(action);
    try {
      const res = await fetch("/api/clipboard-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 3000), action }),
      });
      const data = (await res.json()) as { result: string };
      setResult(data.result);
      toast(`${ACTIONS.find((a) => a.key === action)?.label} concluído!`);
    } catch {
      toast("Erro ao processar texto", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-interactive
      className="fixed top-4 right-4 z-[998] w-80 animate-[widget-pop_0.3s_ease-out]"
    >
      <div className="widget-glass rounded-2xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">
            Texto copiado
          </span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Preview */}
        <p className="text-xs leading-relaxed opacity-70 mb-3 line-clamp-3">{preview}</p>

        {/* Action buttons */}
        {!result ? (
          <div className="grid grid-cols-2 gap-1.5">
            {ACTIONS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => runAction(key)}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  {loading && activeAction === key ? (
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3 text-white" />
                  )}
                </div>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="max-h-48 overflow-y-auto styled-scroll rounded-xl bg-black/5 dark:bg-white/5 p-3 text-xs leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
            <button
              onClick={() => { setResult(""); setActiveAction(null); }}
              className="w-full rounded-xl py-1.5 text-[10px] font-medium opacity-50 hover:opacity-100 hover:bg-white/5 transition-all"
            >
              Outra ação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
