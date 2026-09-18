"use client";

import { useActionState } from "react";
import { updateTermStartAction, type SettingsActionState } from "@/app/actions/settings";

const initialState: SettingsActionState = {};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function UpdateTermStartForm({ termStartDate }: { termStartDate?: Date | null }) {
  const [state, formAction, pending] = useActionState(updateTermStartAction, initialState);

  return (
    <div className="space-y-4 max-w-md">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-sm px-4 py-3">
          {state.success}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">تاريخ بداية الفصل</label>
          <input
            type="date"
            name="termStartDate"
            defaultValue={termStartDate ? toDateInputValue(termStartDate) : ""}
            required
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
        >
          {pending ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
