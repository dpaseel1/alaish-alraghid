"use client";

import { useActionState } from "react";
import { createLeaveRequestAction, type LeaveRequestActionState } from "@/app/actions/staffAttendance";

const initialState: LeaveRequestActionState = {};

export function LeaveRequestForm() {
  const [state, formAction, pending] = useActionState(createLeaveRequestAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-sm px-4 py-3">
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">من تاريخ</label>
          <input
            type="date"
            name="fromDate"
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">إلى تاريخ</label>
          <input
            type="date"
            name="toDate"
            required
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">سبب الإجازة</label>
        <textarea
          name="reason"
          required
          rows={2}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          placeholder="اذكري سبب طلب الإجازة"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الإرسال..." : "إرسال طلب الإجازة"}
      </button>
    </form>
  );
}
