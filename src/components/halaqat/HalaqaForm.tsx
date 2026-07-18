"use client";

import { useActionState } from "react";
import type { HalaqaActionState } from "@/app/actions/halaqat";

type Option = { id: string; name: string };

export function HalaqaForm({
  action,
  teachers,
  supervisors,
  isAdmin,
  initial,
}: {
  action: (
    prev: HalaqaActionState | undefined,
    formData: FormData
  ) => Promise<HalaqaActionState>;
  teachers: Option[];
  supervisors: Option[];
  isAdmin: boolean;
  initial?: {
    name: string;
    time: string;
    teacherId: string | null;
    supervisorId: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          اسم الحلقة
        </label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="مثال: حلقة النور"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          وقت الحلقة
        </label>
        <input
          name="time"
          required
          defaultValue={initial?.time}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="مثال: بعد صلاة العصر"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          المعلمة المسؤولة
        </label>
        <select
          name="teacherId"
          defaultValue={initial?.teacherId ?? ""}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        >
          <option value="">بدون تعيين حاليًا</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            المشرفة
          </label>
          <select
            name="supervisorId"
            defaultValue={initial?.supervisorId ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="">بدون تعيين حاليًا</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ"}
      </button>
    </form>
  );
}
