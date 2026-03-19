"use client";

import { jsPDF } from "jspdf";
import { toast } from "@/components/Toast";

/**
 * Download text as a .md file
 */
export function exportMarkdown(content: string, filename?: string) {
  const name = filename || `alda-export-${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  toast("Markdown exportado!");
}

/**
 * Export text as a styled PDF
 */
export function exportPDF(title: string, content: string, filename?: string) {
  const name = filename || `alda-export-${new Date().toISOString().slice(0, 10)}.pdf`;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, 25);

  // Date
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130);
  doc.text(`ALDA · ${new Date().toLocaleDateString("pt-BR")}`, margin, 32);
  doc.setTextColor(0);

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Body — word-wrap and paginate
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(content, maxWidth);
  let y = 42;
  const lineHeight = 5.5;
  const pageHeight = doc.internal.pageSize.getHeight();

  for (const line of lines) {
    if (y + lineHeight > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(name);
  toast("PDF exportado!");
}
