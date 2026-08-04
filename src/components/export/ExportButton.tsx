"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon } from "@/components/icons";

function withFormat(href: string, format: string) {
  return href.includes("?") ? `${href}&format=${format}` : `${href}?format=${format}`;
}

export function ExportButton({
  href,
  label,
  emphasize = false,
}: {
  href: string;
  label: string;
  emphasize?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (detailsRef.current && detailsRef.current.open && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const triggerClass = emphasize
    ? "inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition print:hidden cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
    : "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition print:hidden cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden";

  async function handlePdf() {
    setPdfBusy(true);
    try {
      const res = await fetch(withFormat(href, "json"));
      if (!res.ok) throw new Error("فشل جلب البيانات");
      const data: { sheets: { name: string; rows: Record<string, unknown>[] }[] } = await res.json();
      const { downloadRowsAsPdf } = await import("@/lib/exportPdf");
      await downloadRowsAsPdf({ title: label, fileName: label, sheets: data.sheets });
    } catch {
      alert("تعذّر إنشاء ملف PDF، حاولي مرة أخرى");
    } finally {
      setPdfBusy(false);
      detailsRef.current?.removeAttribute("open");
    }
  }

  return (
    <details ref={detailsRef} className="relative inline-block print:hidden">
      <summary className={triggerClass}>
        <DownloadIcon className="h-4 w-4" />
        {label}
      </summary>
      <div className="absolute z-10 mt-1 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
        <a
          href={withFormat(href, "xlsx")}
          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Excel (xlsx)
        </a>
        <button
          type="button"
          disabled={pdfBusy}
          onClick={handlePdf}
          className="block w-full text-right px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {pdfBusy ? "جاري التجهيز..." : "PDF"}
        </button>
      </div>
    </details>
  );
}
