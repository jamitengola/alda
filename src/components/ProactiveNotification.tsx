"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Zap } from "lucide-react";

interface Props {
  message: string;
  route: string;
  actionLabel: string;
  onDismiss: () => void;
}

export default function ProactiveNotification({ message, route, actionLabel, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 8s
    const autoDismiss = setTimeout(() => onDismiss(), 8000);
    return () => {
      clearTimeout(t);
      clearTimeout(autoDismiss);
    };
  }, [onDismiss]);

  return (
    <div
      data-interactive
      className={`fixed top-6 right-6 z-[999] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div className="dock-glass flex items-center gap-3 px-4 py-3 max-w-xs">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Zap className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-200 leading-tight">{message}</p>
          <Link
            href={route}
            onClick={onDismiss}
            className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            {actionLabel} →
          </Link>
        </div>
        <button
          onClick={onDismiss}
          className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
