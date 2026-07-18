"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createSupervisorAction,
  type SupervisorActionState,
} from "@/app/actions/supervisors";

const initialState: SupervisorActionState = {};

export function CreateSupervisorForm() {
  const [state, formAction, pending] = useActionState(
    createSupervisorAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-lg">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 text-sm px-4 py-3">
          {state.success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          الاسم الكامل
        </label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اسم المشرفة"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الهوية/الإقامة
        </label>
        <input
          name="nationalId"
          required
          dir="ltr"
          inputMode="numeric"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="1XXXXXXXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          كلمة مرور مبدئية
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="8 أحرف على الأقل"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الإنشاء..." : "إنشاء حساب مشرفة"}
      </button>
    </form>
  );
}
