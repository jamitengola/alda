"use client";

import { FileDown, FileText } from "lucide-react";
import { exportPDF, exportMarkdown } from "@/lib/export";

interface ExportButtonsProps {
  title: string;
  content: string;
  filename?: string;
}

export default function ExportButtons({ title, content, filename }: ExportButtonsProps) {
  if (!content) return null;

  const base = filename || `alda-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => exportPDF(title, content, `${base}.pdf`)}
        className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
        title="Exportar PDF"
      >
        <FileDown className="h-3 w-3" />
        PDF
      </button>
      <button
        onClick={() => exportMarkdown(`# ${title}\n\n${content}`, `${base}.md`)}
        className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
        title="Exportar Markdown"
      >
        <FileText className="h-3 w-3" />
        MD
      </button>
    </div>
  );
}
