"use client";

import { useActionState, useState } from "react";
import { adjustTeacherVolunteerHoursAction, type TeacherActionState } from "@/app/actions/teachers";

const initialState: TeacherActionState = {};

export function VolunteerHoursCell({
  userId,
  totalHours,
  adjustment,
}: {
  userId: string;
  totalHours: number;
  adjustment: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    adjustTeacherVolunteerHoursAction.bind(null, userId),
    initialState
  );

  const [handledSuccess, setHandledSuccess] = useState(state?.success);
  if (state?.success !== handledSuccess) {
    setHandledSuccess(state?.success);
    if (state?.success) setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input
          name="adjustment"
          dir="ltr"
          inputMode="numeric"
          defaultValue={adjustment}
          className="w-16 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
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
          onClick={() => setIsEditing(false)}
          className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
        >
          إلغاء
        </button>
        {state?.error && <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-600 dark:text-slate-300">{totalHours}</span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        title={`تعديل يدوي حالي: ${adjustment}`}
        className="text-xs text-brand hover:underline"
      >
        تعديل
      </button>
    </div>
  );
}
