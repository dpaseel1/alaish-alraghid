"use client";

export function PrintButton({ label = "طباعة / تصدير" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition print:hidden"
    >
      {label}
    </button>
  );
}
