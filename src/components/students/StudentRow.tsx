"use client";

import { useActionState, useState } from "react";
import {
  addExamGradeAction,
  type StudentActionState,
} from "@/app/actions/students";
import { RevealStudentNationalId } from "@/components/students/RevealStudentNationalId";

type Student = {
  id: string;
  name: string;
  nationality: string;
  memorizedPagesTotal: number;
  currentQuota: string | null;
  nationalIdLastFour?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  residence?: string | null;
  memorizedAmount?: string | null;
};

const initialState: StudentActionState = {};

export function StudentRow({
  student,
  showHalaqa,
  halaqaName,
  canManage,
  canRevealNationalId,
  updateAction,
  deleteAction,
}: {
  student: Student;
  showHalaqa?: boolean;
  halaqaName?: string;
  canManage: boolean;
  canRevealNationalId?: boolean;
  updateAction: (
    prev: StudentActionState | undefined,
    formData: FormData
  ) => Promise<StudentActionState>;
  deleteAction: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "grade">("view");
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialState
  );
  const [gradeState, gradeFormAction, gradePending] = useActionState(
    addExamGradeAction,
    initialState
  );

  const colCount =
    1 + // الاسم
    (showHalaqa ? 1 : 0) +
    1 + // الجنسية
    1 + // الأوجه المحفوظة
    1 + // النصاب
    (canRevealNationalId ? 1 : 0) +
    (canManage ? 1 : 0);

  if (mode === "edit") {
    return (
      <tr className="bg-brand/5">
        <td colSpan={colCount} className="px-5 py-3">
          <form action={updateFormAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">الاسم</label>
              <input
                name="name"
                defaultValue={student.name}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">الجنسية</label>
              <input
                name="nationality"
                defaultValue={student.nationality}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">رقم الهوية/الإقامة</label>
              <input
                name="nationalId"
                dir="ltr"
                inputMode="numeric"
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                placeholder="1XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">العمر</label>
              <input
                name="age"
                type="number"
                min={5}
                max={100}
                dir="ltr"
                defaultValue={student.age ?? ""}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">المؤهل الدراسي</label>
              <input
                name="educationLevel"
                defaultValue={student.educationLevel ?? ""}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">مقر الإقامة</label>
              <input
                name="residence"
                defaultValue={student.residence ?? ""}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">مقدار الحفظ</label>
              <input
                name="memorizedAmount"
                defaultValue={student.memorizedAmount ?? ""}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
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
              disabled={updatePending}
              className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark disabled:opacity-60"
            >
              {updatePending ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="text-sm text-slate-500 dark:text-slate-400 hover:underline px-2 py-2"
            >
              إلغاء
            </button>
            {updateState?.error && (
              <span className="text-xs text-red-600 dark:text-red-400 basis-full">{updateState.error}</span>
            )}
          </form>
        </td>
      </tr>
    );
  }

  if (mode === "grade") {
    return (
      <tr className="bg-amber-50/60 dark:bg-amber-950/30">
        <td colSpan={colCount} className="px-5 py-3">
          {gradeState?.success ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700 dark:text-emerald-400">{gradeState.success}</span>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <form action={gradeFormAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="studentId" value={student.id} />
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">النصاب</label>
                <input
                  name="quota"
                  required
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  placeholder="مثال: جزء عم"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">الدرجة</label>
                <input
                  name="grade"
                  type="number"
                  step="0.5"
                  required
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">من</label>
                <input
                  name="maxGrade"
                  type="number"
                  defaultValue={100}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">تاريخ الاختبار</label>
                <input
                  name="examDate"
                  type="date"
                  required
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={gradePending}
                className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark disabled:opacity-60"
              >
                {gradePending ? "جاري الحفظ..." : "حفظ الدرجة"}
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="text-sm text-slate-500 dark:text-slate-400 hover:underline px-2 py-2"
              >
                إلغاء
              </button>
              {gradeState?.error && (
                <span className="text-xs text-red-600 dark:text-red-400 basis-full">{gradeState.error}</span>
              )}
            </form>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{student.name}</td>
      {showHalaqa && (
        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{halaqaName ?? "—"}</td>
      )}
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.nationality}</td>
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.memorizedPagesTotal}</td>
      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{student.currentQuota ?? "—"}</td>
      {canRevealNationalId && (
        <td className="px-5 py-3">
          <RevealStudentNationalId studentId={student.id} lastFour={student.nationalIdLastFour ?? null} />
        </td>
      )}
      {canManage && (
        <td className="px-5 py-3 space-x-2 space-x-reverse whitespace-nowrap">
          <button
            onClick={() => setMode("edit")}
            className="text-xs text-brand hover:underline"
          >
            تعديل
          </button>
          <button
            onClick={() => setMode("grade")}
            className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
          >
            تسجيل درجة
          </button>
          <form action={deleteAction} className="inline">
            <button className="text-xs text-red-600 dark:text-red-400 hover:underline">حذف</button>
          </form>
        </td>
      )}
    </tr>
  );
}
