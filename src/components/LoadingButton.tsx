"use client";

import { Loader2 } from "lucide-react";

type Props = {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
};

export default function LoadingButton({
  loading,
  label,
  loadingLabel,
  disabled,
}: Props) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? (loadingLabel ?? "Processando...") : label}
    </button>
  );
}
