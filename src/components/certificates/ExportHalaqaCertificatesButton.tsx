"use client";

import { useState } from "react";
import {
  renderCertificateToCanvas,
  CERTIFICATE_CANVAS_WIDTH,
  CERTIFICATE_CANVAS_HEIGHT,
  type CertificateData,
} from "@/lib/certificateRender";

type StudentCertificate = CertificateData;

export function ExportHalaqaCertificatesButton({
  halaqaName,
  students,
}: {
  halaqaName: string;
  students: StudentCertificate[];
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  if (students.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500">
        لا توجد طالبات لديهنّ درجات اختبار مسجّلة بعد لتصدير شهاداتهنّ
      </p>
    );
  }

  const exportAll = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const { jsPDF } = await import("jspdf");
      const canvas = document.createElement("canvas");
      canvas.width = CERTIFICATE_CANVAS_WIDTH;
      canvas.height = CERTIFICATE_CANVAS_HEIGHT;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT],
        compress: true,
      });

      for (let i = 0; i < students.length; i++) {
        await renderCertificateToCanvas(canvas, students[i]);
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, CERTIFICATE_CANVAS_WIDTH, CERTIFICATE_CANVAS_HEIGHT);
        setProgress(i + 1);
      }

      pdf.save(`شهادات-${halaqaName}.pdf`);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <button
      type="button"
      onClick={exportAll}
      disabled={busy}
      className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-dark transition disabled:opacity-60 whitespace-nowrap"
    >
      {busy ? `جاري التصدير... (${progress}/${students.length})` : `تصدير شهادات الحلقة (${students.length})`}
    </button>
  );
}
