"use client";

import { useEffect, useRef, useState } from "react";
import { renderCertificateToCanvas, type CertificateData } from "@/lib/certificateRender";

export type { CertificateData };

export function CertificateCanvas({ data }: { data: CertificateData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await renderCertificateToCanvas(canvas, data);
      if (!cancelled) setReady(true);
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [data]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `شهادة-${data.studentName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const openForPrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>شهادة ${data.studentName}</title></head><body style="margin:0"><img src="${dataUrl}" style="width:100%" /></body></html>`
    );
    win.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white">
        <canvas ref={canvasRef} width={3508} height={2480} className="w-full h-auto block" />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={download}
          disabled={!ready}
          className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-50"
        >
          تنزيل الشهادة (صورة)
        </button>
        <button
          type="button"
          onClick={openForPrint}
          disabled={!ready}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          فتح للطباعة
        </button>
      </div>
    </div>
  );
}
