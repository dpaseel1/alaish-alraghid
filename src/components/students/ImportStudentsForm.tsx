"use client";

import { useActionState, useRef, useState } from "react";
import { importStudentsAction, type ImportStudentsResult } from "@/app/actions/students";
import {
  STUDENT_IMPORT_FIELDS,
  isSelectableHeader,
  suggestColumnMapping,
  type StudentImportFieldKey,
} from "@/lib/studentImportFields";

const initialState: ImportStudentsResult = { successCount: 0, failures: [] };

export function ImportStudentsForm({ halaqaId }: { halaqaId: string }) {
  const [state, formAction, pending] = useActionState(importStudentsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [headers, setHeaders] = useState<string[] | null>(null);
  const [sampleRow, setSampleRow] = useState<string[] | null>(null);
  const [mapping, setMapping] = useState<Record<StudentImportFieldKey, number | null> | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setHeaders(null);
      setSampleRow(null);
      setMapping(null);
      return;
    }
    try {
      setReadError(null);
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      const headerRow = (rows[0] ?? []).map((h) => String(h ?? ""));
      const firstDataRow = (rows[1] ?? []).map((v) => String(v ?? ""));
      setHeaders(headerRow);
      setSampleRow(firstDataRow);
      setMapping(suggestColumnMapping(headerRow));
    } catch {
      setHeaders(null);
      setSampleRow(null);
      setMapping(null);
      setReadError("تعذّر قراءة الملف، تأكدي أنه بصيغة Excel صحيحة");
    }
  }

  const mappingComplete = mapping !== null && STUDENT_IMPORT_FIELDS.every((f) => mapping[f.key] !== null);

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
            className="space-y-4"
          >
            <input type="hidden" name="halaqaId" value={halaqaId} />
            <input type="hidden" name="columnMapping" value={mapping ? JSON.stringify(mapping) : ""} />

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  ملف Excel
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
              <button
                type="submit"
                disabled={pending || !mappingComplete}
                className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition disabled:opacity-60"
              >
                {pending ? "جاري الاستيراد..." : "استيراد"}
              </button>
            </div>

            {readError && <p className="text-sm text-red-600 dark:text-red-400">{readError}</p>}

            {headers && mapping && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-3 bg-slate-50 dark:bg-slate-900/40">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  تأكدي من مطابقة كل حقل للعمود الصحيح في ملفك قبل الاستيراد:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STUDENT_IMPORT_FIELDS.map((field) => {
                    const selectedIndex = mapping[field.key];
                    const previewValue =
                      selectedIndex !== null ? (sampleRow?.[selectedIndex] ?? "") : "";
                    return (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          {field.label}
                        </label>
                        <select
                          value={selectedIndex ?? ""}
                          onChange={(e) =>
                            setMapping((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    [field.key]: e.target.value === "" ? null : Number(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2"
                        >
                          <option value="">-- اختاري عمودًا --</option>
                          {headers.map((h, i) =>
                            isSelectableHeader(h) ? (
                              <option key={i} value={i}>
                                {h}
                              </option>
                            ) : null
                          )}
                        </select>
                        {previewValue && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                            مثال: {previewValue}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
