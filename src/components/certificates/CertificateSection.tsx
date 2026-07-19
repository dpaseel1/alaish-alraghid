"use client";

import { useState } from "react";
import { CertificateCanvas, type CertificateData } from "@/components/certificates/CertificateCanvas";

export function CertificateSection({ data }: { data: CertificateData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm print:hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">شهادة تقدير</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            تُعبّى تلقائيًا من آخر درجة اختبار مسجّلة للطالبة (النصاب: {data.quota}، الدرجة: {data.grade}/
            {data.maxGrade})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          {open ? "إخفاء الشهادة" : "إنشاء الشهادة"}
        </button>
      </div>

      {open && (
        <div className="mt-5">
          <CertificateCanvas data={data} />
        </div>
      )}
    </div>
  );
}
