"use client";

import { useActionState } from "react";
import {
  submitDailyDataAction,
  type StudentActionState,
} from "@/app/actions/students";

type Student = {
  id: string;
  name: string;
};

type TodayEntry = {
  studentId: string;
  present: boolean;
};

const initialState: StudentActionState = {};

export function DailyDataForm({
  students,
  todayEntries,
  alreadySubmitted,
}: {
  students: Student[];
  todayEntries: TodayEntry[];
  alreadySubmitted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitDailyDataAction,
    initialState
  );

  const presentMap = new Map(todayEntries.map((e) => [e.studentId, e.present]));

  return (
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
              <th className="px-4 py-2 font-medium">الحضور</th>
              <th className="px-4 py-2 font-medium">الأوجه المحفوظة اليوم</th>
              <th className="px-4 py-2 font-medium">النصاب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  لا توجد طالبات في حلقتك بعد
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    name={`present_${s.id}`}
                    defaultChecked={presentMap.get(s.id) ?? true}
                    className="h-4 w-4 accent-brand"
                  />
                </td>
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
  );
}
