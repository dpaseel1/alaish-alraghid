"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createStudentAction,
  type StudentActionState,
} from "@/app/actions/students";

const initialState: StudentActionState = {};

export function AddStudentForm({ halaqaId }: { halaqaId: string }) {
  const [state, formAction, pending] = useActionState(
    createStudentAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="halaqaId" value={halaqaId} />

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          اسم الطالبة
        </label>
        <input
          name="name"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اسم الطالبة"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          الجنسية
        </label>
        <input
          name="nationality"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="الجنسية"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          رقم الهوية/الإقامة
        </label>
        <input
          name="nationalId"
          required
          dir="ltr"
          inputMode="numeric"
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="1XXXXXXXXX"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          العمر
        </label>
        <input
          name="age"
          type="number"
          min={5}
          max={100}
          dir="ltr"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          المؤهل الدراسي
        </label>
        <input
          name="educationLevel"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          مقر الإقامة
        </label>
        <input
          name="residence"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          مقدار الحفظ
        </label>
        <input
          name="memorizedAmount"
          required
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="مثال: حافظة كاملة / 15 جزءًا"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
          النصاب الحالي
        </label>
        <input
          name="currentQuota"
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اختياري"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الإضافة..." : "إضافة طالبة"}
      </button>

      {state?.error && (
        <span className="text-xs text-red-600 dark:text-red-400 basis-full">{state.error}</span>
      )}
    </form>
  );
}
