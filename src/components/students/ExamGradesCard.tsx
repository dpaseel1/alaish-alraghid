"use client";

import { useActionState, useState } from "react";
import { addExamGradeAction, type StudentActionState } from "@/app/actions/students";

const initialState: StudentActionState = {};

type LatestGrade = { quota: string; grade: number; maxGrade: number } | null;

function ExamGradeRow({
  studentId,
  studentName,
  latestGrade,
}: {
  studentId: string;
  studentName: string;
  latestGrade: LatestGrade;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addExamGradeAction, initialState);

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 align-top">
      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
        {studentName}
      </td>
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {latestGrade ? `${latestGrade.quota}: ${latestGrade.grade}/${latestGrade.maxGrade}` : "لا توجد درجات مسجّلة بعد"}
      </td>
      <td className="px-5 py-3">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-brand hover:underline"
          >
            تسجيل درجة اختبار
          </button>
        )}
        {open && state?.success && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-700 dark:text-emerald-400">{state.success}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              إغلاق
            </button>
          </div>
        )}
        {open && !state?.success && (
          <form action={formAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="studentId" value={studentId} />
            <input
              name="quota"
              required
              placeholder="النصاب (مثال: جزء عم)"
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs w-32"
            />
            <input
              name="grade"
              type="number"
              step="0.5"
              required
              placeholder="الدرجة"
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs w-20"
            />
            <input
              name="maxGrade"
              type="number"
              defaultValue={100}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs w-20"
            />
            <input
              name="examDate"
              type="date"
              required
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              إلغاء
            </button>
            {state?.error && (
              <span className="text-xs text-red-600 dark:text-red-400 basis-full">{state.error}</span>
            )}
          </form>
        )}
      </td>
    </tr>
  );
}

export function ExamGradesCard({
  students,
}: {
  students: { id: string; name: string; latestGrade: LatestGrade }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">تسجيل درجات الاختبارات</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          الدرجة المسجّلة هنا تُستخدم تلقائيًا عند توليد شهادة تقدير للطالبة من صفحة الأرشيف والشهادات
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
              <th className="px-5 py-3 font-medium">الاسم</th>
              <th className="px-5 py-3 font-medium">آخر درجة مسجّلة</th>
              <th className="px-5 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                  لا توجد طالبات مضافات بعد
                </td>
              </tr>
            )}
            {students.map((s) => (
              <ExamGradeRow key={s.id} studentId={s.id} studentName={s.name} latestGrade={s.latestGrade} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
