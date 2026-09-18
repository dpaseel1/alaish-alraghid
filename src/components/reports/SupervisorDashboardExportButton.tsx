"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/icons";
import type { SupervisorDashboardData } from "@/lib/supervisorDashboard";

export function SupervisorDashboardExportButton({ data }: { data: SupervisorDashboardData }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const { downloadSupervisorDashboardPdf } = await import("@/lib/exportSupervisorDashboardPdf");
      await downloadSupervisorDashboardPdf(data);
    } catch (err) {
      console.error("Supervisor dashboard PDF export failed:", err);
      alert("تعذّر إنشاء ملف PDF، حاولي مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition print:hidden disabled:opacity-50"
    >
      <DownloadIcon className="h-4 w-4" />
      {busy ? "جاري التجهيز..." : "تصدير PDF"}
    </button>
  );
}
