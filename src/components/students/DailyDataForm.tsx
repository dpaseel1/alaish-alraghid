"use client";

import { useActionState, useState } from "react";
import {
  submitWeeklyDataAction,
  toggleStudentAttendanceAction,
  toggleStudentRecitationAction,
  type StudentActionState,
} from "@/app/actions/students";
import { CheckIcon, XIcon } from "@/components/icons";
import { normalizeDecimal } from "@/lib/numbers";
import type { StudentAttendanceStatus } from "@/generated/prisma/client";

type Student = {
  id: string;
  name: string;
  memorizedPagesTotal: number;
};

type WeekDay = {
  iso: string;
  label: string;
};

const initialState: StudentActionState = {};

const IS_ABSENT = (status: StudentAttendanceStatus | undefined) =>
  status === "ABSENT_EXCUSED" || status === "ABSENT_UNEXCUSED";

function seedMatrix(
  students: Student[],
  weekDays: WeekDay[],
  values?: Record<string, Record<string, number | string>>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const s of students) {
    result[s.id] = {};
    for (const day of weekDays) {
      const v = values?.[s.id]?.[day.iso];
      result[s.id][day.iso] = v === undefined || v === null || v === "" ? "" : String(v);
    }
  }
  return result;
}

export function DailyDataForm({
  halaqaId,
  students,
  weekDays,
  todayIso,
  weekAttendance,
  weekRecitation,
  recitationEnabled,
  uniformQuota,
  alreadySubmitted,
  weekPages,
  weekQuota,
  weekPagesReviewed,
}: {
  halaqaId?: string;
  students: Student[];
  weekDays: WeekDay[];
  todayIso: string;
  weekAttendance: Record<string, Record<string, StudentAttendanceStatus>>;
  weekRecitation?: Record<string, boolean>;
  recitationEnabled?: boolean;
  uniformQuota?: boolean;
  alreadySubmitted: boolean;
  weekPages?: Record<string, Record<string, number>>;
  weekQuota?: Record<string, Record<string, string>>;
  weekPagesReviewed?: Record<string, Record<string, number>>;
}) {
  const [state, formAction, pending] = useActionState(
    submitWeeklyDataAction,
    initialState
  );

  const isLocked = (dateIso: string) => dateIso > todayIso;

  // وضع النصاب الموحّد: خانة إدخال واحدة لليوم الحالي تُطبَّق على كل الطالبات - بلا تغيير عن السابق
  const [uniformQuotaValue, setUniformQuotaValue] = useState(
    Object.values(weekQuota ?? {})
      .map((byDate) => byDate[todayIso])
      .find((v) => v !== undefined) ?? ""
  );
  const uniformQuotaNumber = Number(uniformQuotaValue);
  const uniformQuotaValid = uniformQuotaValue.trim() !== "" && Number.isFinite(uniformQuotaNumber);

  // الجدول الأسبوعي الموحّد (غير النصاب الموحّد): خانات controlled لتمكين أداة التعبئة السريعة
  const [pagesState, setPagesState] = useState(() => seedMatrix(students, weekDays, weekPages));
  const [quotaState, setQuotaState] = useState(() => seedMatrix(students, weekDays, weekQuota));
  const [reviewedState, setReviewedState] = useState(() => seedMatrix(students, weekDays, weekPagesReviewed));
  const [bulkFillValue, setBulkFillValue] = useState("");

  const setCell = (
    setter: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>,
    studentId: string,
    dateIso: string,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [dateIso]: value } }));
  };

  const applyBulkFillToToday = () => {
    const normalized = normalizeDecimal(bulkFillValue).trim();
    setPagesState((prev) => {
      const next = { ...prev };
      for (const s of students) next[s.id] = { ...next[s.id], [todayIso]: normalized };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {students.length > 0 && weekDays.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3">
          لا يوجد يوم من أيام انعقاد الحلقة ضمن الأسبوع الدراسي الحالي (الأحد-الخميس)، لذا لا تظهر شبكة تحضير هذا الأسبوع.
        </p>
      )}

      {uniformQuota ? (
        <>
          {students.length > 0 && weekDays.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-4 py-2 font-medium">الطالبة</th>
                    <th className="px-4 py-2 font-medium">الحضور الأسبوعي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {s.name}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {weekDays.map((day) => {
                            const current = weekAttendance[s.id]?.[day.iso];
                            const locked = isLocked(day.iso);
                            return (
                              <AttendanceDayCell
                                key={day.iso}
                                studentId={s.id}
                                day={day}
                                current={current}
                                locked={locked}
                              />
                            );
                          })}
                          {recitationEnabled && (
                            <RecitationCell studentId={s.id} recited={weekRecitation?.[s.id] ?? false} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {students.length > 0 && weekDays.length > 0 && recitationEnabled && (
            <RecitationHint />
          )}

          <form action={formAction} className="space-y-4">
            {halaqaId && <input type="hidden" name="halaqaId" value={halaqaId} />}
            <FormMessages alreadySubmitted={alreadySubmitted} state={state} />

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                عدد الأوجه المضافة اليوم لكل الطالبات
              </label>
              <input
                dir="ltr"
                inputMode="decimal"
                name="quota"
                value={uniformQuotaValue}
                onChange={(e) => setUniformQuotaValue(e.target.value)}
                className="w-48 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                placeholder="اختياري"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                يُضاف هذا الرقم تلقائيًا فوق رصيد كل طالبة المحفوظ سابقًا (لا يُستبدل به)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-4 py-2 font-medium">الطالبة</th>
                    <th className="px-4 py-2 font-medium">عدد الأوجه</th>
                    <th className="px-4 py-2 font-medium">المتوقع بعد اليوم</th>
                    {recitationEnabled && <th className="px-4 py-2 font-medium">عدد أوجه المراجعة</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {students.length === 0 && (
                    <tr>
                      <td
                        colSpan={3 + (recitationEnabled ? 1 : 0)}
                        className="px-4 py-6 text-center text-slate-400 dark:text-slate-500"
                      >
                        لا توجد طالبات في حلقتك بعد
                      </td>
                    </tr>
                  )}
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{s.memorizedPagesTotal}</td>
                      <td className="px-4 py-2 font-medium text-brand">
                        {uniformQuotaValid ? s.memorizedPagesTotal + uniformQuotaNumber : "—"}
                      </td>
                      {recitationEnabled && (
                        <td className="px-4 py-2">
                          <input
                            dir="ltr"
                            inputMode="decimal"
                            name={`pagesReviewed_${s.id}`}
                            defaultValue={weekPagesReviewed?.[s.id]?.[todayIso] ?? ""}
                            className="w-24 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
                            placeholder="0"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SaveButton show={students.length > 0} pending={pending} />
          </form>
        </>
      ) : (
        <>
          {students.length > 0 && weekDays.length > 0 && (
            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  تعبئة سريعة لأوجه اليوم لكل الطالبات
                </label>
                <input
                  dir="ltr"
                  inputMode="decimal"
                  value={bulkFillValue}
                  onChange={(e) => setBulkFillValue(e.target.value)}
                  className="w-32 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
                  placeholder="مثلاً 2"
                />
              </div>
              <button
                type="button"
                onClick={applyBulkFillToToday}
                className="rounded-lg border border-brand text-brand text-sm font-medium px-3 py-1.5 hover:bg-brand/5 transition"
              >
                تطبيق على الكل
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500 basis-full">
                تُطبَّق فقط على عمود اليوم الحالي، وتبقى خانة كل طالبة قابلة للتعديل الفردي قبل الحفظ
              </p>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {halaqaId && <input type="hidden" name="halaqaId" value={halaqaId} />}
            <FormMessages alreadySubmitted={alreadySubmitted} state={state} />

            {students.length > 0 && weekDays.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                      <th className="px-4 py-2 font-medium sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 whitespace-nowrap">
                        الطالبة
                      </th>
                      <th className="px-3 py-2 font-medium text-center whitespace-nowrap">عدد الأوجه</th>
                      {weekDays.map((day) => (
                        <th key={day.iso} className="px-2 py-2 font-medium text-center min-w-[130px]">
                          {day.label}
                        </th>
                      ))}
                      {recitationEnabled && (
                        <th className="px-3 py-2 font-medium text-center whitespace-nowrap">السرد</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap sticky right-0 bg-white dark:bg-slate-800 z-10">
                          {s.name}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">
                          {s.memorizedPagesTotal}
                        </td>
                        {weekDays.map((day) => {
                          const status = weekAttendance[s.id]?.[day.iso];
                          const locked = isLocked(day.iso);
                          const inputsDisabled = locked || IS_ABSENT(status);
                          return (
                            <td key={day.iso} className={`px-2 py-2 align-top ${locked ? "opacity-40" : ""}`}>
                              <div className="flex flex-col items-center gap-1.5">
                                <AttendanceDayCell studentId={s.id} day={day} current={status} locked={locked} />
                                <input
                                  dir="ltr"
                                  inputMode="decimal"
                                  name={`pages_${s.id}_${day.iso}`}
                                  value={pagesState[s.id]?.[day.iso] ?? ""}
                                  onChange={(e) => setCell(setPagesState, s.id, day.iso, e.target.value)}
                                  disabled={inputsDisabled}
                                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  placeholder="أوجه"
                                  title="عدد الأوجه المحفوظة"
                                />
                                <input
                                  type="text"
                                  name={`quota_${s.id}_${day.iso}`}
                                  value={quotaState[s.id]?.[day.iso] ?? ""}
                                  onChange={(e) => setCell(setQuotaState, s.id, day.iso, e.target.value)}
                                  disabled={inputsDisabled}
                                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                  placeholder="النصاب"
                                  title="النصاب"
                                />
                                {recitationEnabled && (
                                  <input
                                    dir="ltr"
                                    inputMode="decimal"
                                    name={`pagesReviewed_${s.id}_${day.iso}`}
                                    value={reviewedState[s.id]?.[day.iso] ?? ""}
                                    onChange={(e) => setCell(setReviewedState, s.id, day.iso, e.target.value)}
                                    disabled={inputsDisabled}
                                    className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="مراجعة"
                                    title="عدد أوجه المراجعة"
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                        {recitationEnabled && (
                          <td className="px-3 py-2 text-center">
                            <RecitationCell studentId={s.id} recited={weekRecitation?.[s.id] ?? false} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {students.length > 0 && weekDays.length > 0 && recitationEnabled && <RecitationHint />}

            <SaveButton show={students.length > 0} pending={pending} />
          </form>
        </>
      )}
    </div>
  );
}

function FormMessages({
  alreadySubmitted,
  state,
}: {
  alreadySubmitted: boolean;
  state: StudentActionState;
}) {
  return (
    <>
      {alreadySubmitted && !state?.success && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm px-4 py-3">
          تم تسجيل بيانات هذا الأسبوع مسبقًا، يمكنك تعديلها وإعادة الحفظ.
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 text-sm px-4 py-3">
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}
    </>
  );
}

function SaveButton({ show, pending }: { show: boolean; pending: boolean }) {
  if (!show) return null;
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
    >
      {pending ? "جاري الحفظ..." : "حفظ"}
    </button>
  );
}

function RecitationHint() {
  return (
    <p className="text-xs text-slate-400 dark:text-slate-500">
      خانة <span className="text-violet-600 dark:text-violet-400 font-bold">السرد</span> أسبوعية ومستقلة عن
      &quot;عدد أوجه المراجعة&quot; اليومية، وتُحتسب بمجموع الأوجه المحفوظة خلال الأسبوع
    </p>
  );
}

function AttendanceDayCell({
  studentId,
  day,
  current,
  locked,
}: {
  studentId: string;
  day: WeekDay;
  current: StudentAttendanceStatus | undefined;
  locked: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-400 dark:text-slate-500">{day.label}</span>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
          <form action={toggleStudentAttendanceAction.bind(null, studentId, day.iso, "PRESENT")}>
            <button
              type="submit"
              title="حضور"
              disabled={locked}
              className={
                current === "PRESENT"
                  ? "flex h-7 w-7 items-center justify-center bg-emerald-600 text-white disabled:cursor-not-allowed"
                  : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:enabled:bg-emerald-50 dark:hover:enabled:bg-emerald-950/30 hover:enabled:text-emerald-600 disabled:cursor-not-allowed"
              }
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </form>
          <form action={toggleStudentAttendanceAction.bind(null, studentId, day.iso, "ABSENT_UNEXCUSED")}>
            <button
              type="submit"
              title="غياب"
              disabled={locked}
              className={
                IS_ABSENT(current)
                  ? "flex h-7 w-7 items-center justify-center bg-red-600 text-white disabled:cursor-not-allowed"
                  : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:enabled:bg-red-50 dark:hover:enabled:bg-red-950/30 hover:enabled:text-red-600 disabled:cursor-not-allowed"
              }
            >
              <XIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
        {IS_ABSENT(current) && !locked && (
          <div className="flex items-center rounded-md overflow-hidden border border-slate-200 dark:border-slate-600 text-[10px]">
            <form action={toggleStudentAttendanceAction.bind(null, studentId, day.iso, "ABSENT_EXCUSED")}>
              <button
                type="submit"
                title="غياب بعذر"
                className={`px-1.5 py-0.5 font-medium ${
                  current === "ABSENT_EXCUSED"
                    ? "bg-amber-600 text-white"
                    : "bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
              >
                بعذر
              </button>
            </form>
            <form action={toggleStudentAttendanceAction.bind(null, studentId, day.iso, "ABSENT_UNEXCUSED")}>
              <button
                type="submit"
                title="غياب بدون عذر"
                className={`px-1.5 py-0.5 font-medium ${
                  current === "ABSENT_UNEXCUSED"
                    ? "bg-red-600 text-white"
                    : "bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                }`}
              >
                بدون
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function RecitationCell({ studentId, recited }: { studentId: string; recited: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">السرد</span>
      <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
        <form action={toggleStudentRecitationAction.bind(null, studentId, true)}>
          <button
            type="submit"
            title="سردت"
            className={
              recited
                ? "flex h-7 w-7 items-center justify-center bg-violet-600 text-white"
                : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-600"
            }
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </form>
        <form action={toggleStudentRecitationAction.bind(null, studentId, false)}>
          <button
            type="submit"
            title="لم تسرد"
            className={
              !recited
                ? "flex h-7 w-7 items-center justify-center bg-slate-400 text-white"
                : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            }
          >
            <XIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
