"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { importAttendanceExcelAction, type ImportAttendanceResult } from "@/app/actions/students";
import { normalizeArabicName } from "@/lib/arabicName";

const initialState: ImportAttendanceResult = { successCount: 0, absentCount: 0, failures: [] };

type Student = { id: string; name: string };

type RowMatch = {
  row: number;
  fileName: string;
  studentId: string | null;
};

// أعمدة يضيفها مايكروسوفت فورمز تلقائيًا لكل استبانة - تُستبعد من قائمة اختيار عمود الاسم لتسهيل العرض فقط
const KNOWN_METADATA_HEADERS = new Set(["Id", "وقت البدء", "وقت الإكمال", "البريد الإلكتروني"]);

function isSelectableHeader(header: string): boolean {
  const t = header.trim();
  if (!t) return false;
  if (KNOWN_METADATA_HEADERS.has(t)) return false;
  if (t.startsWith("النقاط - ") || t.startsWith("الملاحظات - ")) return false;
  return true;
}

function suggestNameColumn(headers: string[]): number | null {
  let bestIndex: number | null = null;
  let bestLength = -1;
  headers.forEach((h, i) => {
    if (!isSelectableHeader(h)) return;
    const normalized = h.trim();
    if (normalized.includes("اسم") && normalized.length > bestLength) {
      bestIndex = i;
      bestLength = normalized.length;
    }
  });
  return bestIndex;
}

export function ImportAttendanceForm({
  halaqaId,
  weekDays,
  students,
}: {
  halaqaId?: string;
  weekDays: { iso: string; label: string }[];
  students: Student[];
}) {
  const [state, formAction, pending] = useActionState(importAttendanceExcelAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [headers, setHeaders] = useState<string[] | null>(null);
  const [dataRows, setDataRows] = useState<string[][] | null>(null);
  const [nameColumn, setNameColumn] = useState<number | null>(null);
  const [matches, setMatches] = useState<RowMatch[] | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const studentsByNormalizedName = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const key = normalizeArabicName(s.name);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [students]);

  function buildMatches(rows: string[][], columnIndex: number): RowMatch[] {
    return rows
      .map((row, i) => ({ row: i + 2, fileName: String(row[columnIndex] ?? "").trim() }))
      .filter((r) => r.fileName)
      .map((r) => {
        const candidates = studentsByNormalizedName.get(normalizeArabicName(r.fileName));
        const studentId = candidates?.length === 1 ? candidates[0].id : null;
        return { ...r, studentId };
      });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setHeaders(null);
      setDataRows(null);
      setNameColumn(null);
      setMatches(null);
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
      const body = rows.slice(1).map((row) => row.map((v) => String(v ?? "")));
      const suggestedColumn = suggestNameColumn(headerRow);

      setHeaders(headerRow);
      setDataRows(body);
      setNameColumn(suggestedColumn);
      setMatches(suggestedColumn !== null ? buildMatches(body, suggestedColumn) : null);
    } catch {
      setHeaders(null);
      setDataRows(null);
      setNameColumn(null);
      setMatches(null);
      setReadError("تعذّر قراءة الملف، تأكدي أنه بصيغة Excel صحيحة");
    }
  }

  function handleNameColumnChange(columnIndex: number) {
    setNameColumn(columnIndex);
    if (dataRows) setMatches(buildMatches(dataRows, columnIndex));
  }

  function handleMatchChange(row: number, studentId: string) {
    setMatches((prev) =>
      prev ? prev.map((m) => (m.row === row ? { ...m, studentId: studentId || null } : m)) : prev
    );
  }

  const matchedStudentIds = matches?.filter((m) => m.studentId).map((m) => m.studentId as string) ?? [];
  const matchedCount = new Set(matchedStudentIds).size;
  const unmatchedRows = matches?.filter((m) => !m.studentId) ?? [];
  const unmatchedStudents = matches
    ? students.filter((s) => !new Set(matchedStudentIds).has(s.id))
    : [];
  const canSubmit = matches !== null && matchedCount > 0;

  if (weekDays.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"
      >
        استيراد الحضور من Excel
        <span className="text-xs text-slate-400 dark:text-slate-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            ارفعي الملف (مثل استبانة مايكروسوفت فورمز) وحددي عمود الاسم، وستُطابَق كل طالبة موجودة في الملف تلقائيًا
            وتُسجَّل حاضرة، وكل طالبة أخرى من الحلقة لم تظهر في الملف تُسجَّل تلقائيًا غياب بدون عذر لنفس اليوم.
          </p>

          <form ref={formRef} action={formAction} className="space-y-4">
            {halaqaId && <input type="hidden" name="halaqaId" value={halaqaId} />}
            <input
              type="hidden"
              name="presentStudentIds"
              value={JSON.stringify([...new Set(matchedStudentIds)])}
            />

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">اليوم</label>
                <select
                  name="dateIso"
                  required
                  className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2"
                >
                  {weekDays.map((day) => (
                    <option key={day.iso} value={day.iso}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">ملف Excel</label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {readError && <p className="text-sm text-red-600 dark:text-red-400">{readError}</p>}

            {headers && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-3 bg-slate-50 dark:bg-slate-900/40">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    عمود اسم الطالبة
                  </label>
                  <select
                    value={nameColumn ?? ""}
                    onChange={(e) => handleNameColumnChange(Number(e.target.value))}
                    className="w-full sm:w-72 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2"
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
                </div>

                {matches && (
                  <div className="space-y-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      {matchedCount} طالبة ستُسجَّل حاضرة من الملف
                    </p>

                    {unmatchedRows.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                          أسماء من الملف بحاجة لمراجعة يدوية (لم تُطابَق تلقائيًا بطالبة واحدة بوضوح):
                        </p>
                        <div className="space-y-2">
                          {unmatchedRows.map((m) => (
                            <div key={m.row} className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-slate-600 dark:text-slate-300 min-w-[10rem]">
                                {m.fileName}
                              </span>
                              <select
                                value={m.studentId ?? ""}
                                onChange={(e) => handleMatchChange(m.row, e.target.value)}
                                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-2 py-1"
                              >
                                <option value="">-- تجاهل هذا الصف --</option>
                                {students.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {unmatchedStudents.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                          {unmatchedStudents.length} طالبة لم تظهر في الملف وستُسجَّل غياب بدون عذر تلقائيًا:
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {unmatchedStudents.map((s) => s.name).join("، ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !canSubmit}
              className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition disabled:opacity-60"
            >
              {pending ? "جاري الاستيراد..." : "استيراد وحفظ الحضور"}
            </button>
          </form>

          {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

          {(state.successCount > 0 || state.absentCount > 0) && !state.error && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              تم تسجيل {state.successCount} طالبة حاضرة، و{state.absentCount} طالبة غياب بدون عذر تلقائيًا
            </p>
          )}
        </div>
      )}
    </div>
  );
}
