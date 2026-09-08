"use client";

import { useActionState, useState } from "react";
import { updateMemorizationRecordAction, type StudentActionState } from "@/app/actions/students";

type MemorizationRecord = {
  id: string;
  date: Date;
  pagesMemorized: number;
  quota: string | null;
};

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

const initialState: StudentActionState = {};

export function MemorizationRecordRow({ record }: { record: MemorizationRecord }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMemorizationRecordAction.bind(null, record.id),
    initialState
  );

  if (isEditing) {
    return (
      <tr className="bg-brand/5">
        <td colSpan={3} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <span dir="ltr" className="text-sm text-slate-500 dark:text-slate-400 self-center">
              {toDateInputValue(record.date)}
            </span>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">الأوجه المحفوظة</label>
              <input
                name="pagesMemorized"
                type="number"
                min={0}
                defaultValue={record.pagesMemorized}
                required
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">النصاب</label>
              <input
                name="quota"
                defaultValue={record.quota ?? ""}
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
    <tr>
      <td className="px-4 py-2" dir="ltr">
        {toDateInputValue(record.date)}
      </td>
      <td className="px-4 py-2">{record.pagesMemorized}</td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <span>{record.quota ?? "—"}</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-brand hover:underline print:hidden"
          >
            تعديل
          </button>
        </div>
      </td>
    </tr>
  );
}
