"use client";

import { useActionState, useState } from "react";
import { updateStudentNumbersAction, type StudentActionState } from "@/app/actions/students";

type Student = {
  id: string;
  name: string;
  nationality: string;
  memorizedPagesTotal: number;
  reviewedPagesTotal?: number;
  currentQuota: string | null;
};

const initialState: StudentActionState = {};

export function StudentNumbersRow({
  student,
  showReviewedPages,
}: {
  student: Student;
  showReviewedPages?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateStudentNumbersAction.bind(null, student.id),
    initialState
  );

  const colCount = 1 + 1 + 1 + (showReviewedPages ? 1 : 0) + 1 + 1;

  if (isEditing) {
    return (
      <tr className="bg-brand/5">
        <td colSpan={colCount} className="px-5 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 self-center">
              {student.name}
            </span>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                إجمالي الأوجه المحفوظة
              </label>
              <input
                name="memorizedPagesTotal"
                type="number"
                min={0}
                defaultValue={student.memorizedPagesTotal}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
              />
            </div>
            {showReviewedPages && (
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                  عدد أوجه المراجعة
                </label>
                <input
                  name="reviewedPagesTotal"
                  type="number"
                  min={0}
                  defaultValue={student.reviewedPagesTotal ?? 0}
                  required
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">النصاب الحالي</label>
              <input
                name="currentQuota"
                defaultValue={student.currentQuota ?? ""}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-slate-500 dark:text-slate-400 hover:underline px-2 py-2"
            >
              إلغاء
            </button>
            {state?.error && (
              <span className="text-xs text-red-600 dark:text-red-400 basis-full">{state.error}</span>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{student.name}</td>
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.nationality}</td>
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.memorizedPagesTotal}</td>
      {showReviewedPages && (
        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.reviewedPagesTotal ?? 0}</td>
      )}
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.currentQuota ?? "—"}</td>
      <td className="px-5 py-3">
        <button onClick={() => setIsEditing(true)} className="text-xs text-brand hover:underline">
          تعديل
        </button>
      </td>
    </tr>
  );
}
