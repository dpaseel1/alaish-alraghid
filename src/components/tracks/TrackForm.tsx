"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { TrackActionState } from "@/app/actions/tracks";

const initialState: TrackActionState = {};

export function TrackForm({
  action,
  defaultName,
  cancelHref,
  submitLabel,
}: {
  action: (
    state: TrackActionState | undefined,
    formData: FormData
  ) => Promise<TrackActionState>;
  defaultName?: string;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          اسم المسار
        </label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={defaultName}
          placeholder="مثال: مسار الجمان"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
        >
          {pending ? "جاري الحفظ..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
