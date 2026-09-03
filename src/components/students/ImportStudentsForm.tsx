"use client";

import { useActionState, useRef, useState } from "react";
import { importStudentsAction, type ImportStudentsResult } from "@/app/actions/students";

const initialState: ImportStudentsResult = { successCount: 0, failures: [] };

export function ImportStudentsForm({ halaqaId }: { halaqaId: string }) {
  const [state, formAction, pending] = useActionState(importStudentsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"
      >
        استيراد طالبات من Excel
        <span className="text-xs text-slate-400 dark:text-slate-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <a
            href="/api/export/students-template"
            className="inline-block text-sm text-brand hover:underline"
          >
            تنزيل قالب Excel فارغ
          </a>

          <form
            ref={formRef}
            action={formAction}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="halaqaId" value={halaqaId} />
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                ملف Excel
              </label>
              <input
                type="file"
                name="file"
                required
                accept=".xlsx,.xls"
                className="text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition disabled:opacity-60"
            >
              {pending ? "جاري الاستيراد..." : "استيراد"}
            </button>
          </form>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          {(state.successCount > 0 || state.failures.length > 0) && !state.error && (
            <div className="text-sm space-y-2">
              <p className="text-emerald-700 dark:text-emerald-400">
                تم استيراد {state.successCount} طالبة بنجاح
              </p>
              {state.failures.length > 0 && (
                <div>
                  <p className="text-red-600 dark:text-red-400 mb-1">
                    {state.failures.length} صف مرفوض:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5">
                    {state.failures.map((f, i) => (
                      <li key={i}>
                        الصف {f.row}: {f.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
