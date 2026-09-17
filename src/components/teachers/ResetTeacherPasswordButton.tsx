"use client";

import { useActionState, useState } from "react";
import { adminResetTeacherPasswordAction, type TeacherActionState } from "@/app/actions/teachers";

const initialState: TeacherActionState = {};

export function ResetTeacherPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    adminResetTeacherPasswordAction.bind(null, userId),
    initialState
  );

  const [handledSuccess, setHandledSuccess] = useState(state?.success);
  if (state?.success !== handledSuccess) {
    setHandledSuccess(state?.success);
    if (state?.success) setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand hover:underline"
      >
        تغيير كلمة المرور
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400 dark:text-slate-500">كلمة مرور جديدة لـ{name}:</span>
      <input
        type="password"
        name="newPassword"
        required
        minLength={8}
        placeholder="8 أحرف على الأقل"
        className="w-40 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white text-xs font-medium px-2.5 py-1.5 hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "..." : "حفظ"}
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
      >
        إلغاء
      </button>
      {state?.error && <span className="text-xs text-red-600 dark:text-red-400 basis-full">{state.error}</span>}
    </form>
  );
}
