"use client";

import { useEffect, useRef } from "react";
import {
  renderCertificateToCanvas,
  CERTIFICATE_CANVAS_WIDTH,
  CERTIFICATE_CANVAS_HEIGHT,
  type CertificateLayout,
} from "@/lib/certificateRender";

const DUMMY_DATA = { studentName: "اسم الطالبة", quota: "خمسة أجزاء", grade: 95, maxGrade: 100 };

export function TemplateEditorCanvas({
  backgroundUrl,
  layout,
}: {
  backgroundUrl: string | null;
  layout: CertificateLayout;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCertificateToCanvas(canvas, DUMMY_DATA, backgroundUrl ? { backgroundUrl, layout } : null);
  }, [backgroundUrl, layout]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white">
      <canvas
        ref={canvasRef}
        width={CERTIFICATE_CANVAS_WIDTH}
        height={CERTIFICATE_CANVAS_HEIGHT}
        className="w-full h-auto block"
      />
    </div>
  );
}
