"use client";

import { useActionState } from "react";
import {
  submitDailyDataAction,
  toggleStudentAttendanceAction,
  type StudentActionState,
} from "@/app/actions/students";

type Student = {
  id: string;
  name: string;
};

type WeekDay = {
  iso: string;
  label: string;
};

const initialState: StudentActionState = {};

export function DailyDataForm({
  students,
  weekDays,
  weekAttendance,
  alreadySubmitted,
}: {
  students: Student[];
  weekDays: WeekDay[];
  weekAttendance: Record<string, Record<string, boolean>>;
  alreadySubmitted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitDailyDataAction,
    initialState
  );

  return (
    <div className="space-y-6">
      {students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-4 py-2 font-medium">الطالبة</th>
                <th className="px-4 py-2 font-medium">الحضور الأسبوعي (الأحد - الخميس)</th>
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
                        const present = weekAttendance[s.id]?.[day.iso];
                        return (
                          <div key={day.iso} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {day.label}
                            </span>
                            <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                              <form
                                action={toggleStudentAttendanceAction.bind(null, s.id, day.iso, true)}
                              >
                                <button
                                  type="submit"
                                  title="حضور"
                                  className={
                                    present === true
                                      ? "flex h-7 w-7 items-center justify-center bg-emerald-600 text-white text-xs font-bold"
                                      : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold"
                                  }
                                >
                                  ✓
                                </button>
                              </form>
                              <form
                                action={toggleStudentAttendanceAction.bind(null, s.id, day.iso, false)}
                              >
                                <button
                                  type="submit"
                                  title="غياب"
                                  className={
                                    present === false
                                      ? "flex h-7 w-7 items-center justify-center bg-red-600 text-white text-xs font-bold"
                                      : "flex h-7 w-7 items-center justify-center bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold"
                                  }
                                >
                                  ✕
                                </button>
                              </form>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {alreadySubmitted && !state?.success && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm px-4 py-3">
            تم تسجيل بيانات اليوم مسبقًا، يمكنك تعديلها وإعادة الحفظ.
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-4 py-2 font-medium">الطالبة</th>
                <th className="px-4 py-2 font-medium">الأوجه المحفوظة اليوم</th>
                <th className="px-4 py-2 font-medium">النصاب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    لا توجد طالبات في حلقتك بعد
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      name={`pages_${s.id}`}
                      className="w-24 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      name={`quota_${s.id}`}
                      className="w-32 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
                      placeholder="اختياري"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length > 0 && (
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
          >
            {pending ? "جاري الحفظ..." : "حفظ بيانات اليوم"}
          </button>
        )}
      </form>
    </div>
  );
}
