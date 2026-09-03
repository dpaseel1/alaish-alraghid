"use client";

import { useActionState } from "react";
import type { HalaqaActionState } from "@/app/actions/halaqat";
import { HALAQA_CATEGORIES, HALAQA_CATEGORY_LABELS } from "@/lib/halaqaCategory";
import { HALAQA_DAYS, HALAQA_DAY_LABELS } from "@/lib/halaqaDays";
import type { HalaqaCategory } from "@/generated/prisma/client";

type Option = { id: string; name: string };

export function HalaqaForm({
  action,
  teachers,
  tracks,
  isAdmin,
  initial,
}: {
  action: (
    prev: HalaqaActionState | undefined,
    formData: FormData
  ) => Promise<HalaqaActionState>;
  teachers: Option[];
  tracks: Option[];
  isAdmin: boolean;
  initial?: {
    name: string;
    time: string;
    category?: HalaqaCategory | null;
    teacherId: string | null;
    supervisorName?: string | null;
    trackId?: string | null;
    days?: string[];
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
          أيام الحلقة
        </label>
        <div className="flex flex-wrap gap-3">
          {HALAQA_DAYS.map((d) => (
            <label
              key={d}
              className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 cursor-pointer"
            >
              <input
                type="checkbox"
                name="days"
                value={d}
                defaultChecked={initial?.days?.includes(d)}
              />
              {HALAQA_DAY_LABELS[d]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          تصنيف الحلقة
        </label>
        <select
          name="category"
          required
          defaultValue={initial?.category ?? ""}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        >
          <option value="" disabled>
            اختاري تصنيف الحلقة
          </option>
          {HALAQA_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {HALAQA_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
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

      {isAdmin ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            المسار
          </label>
          <select
            name="trackId"
            defaultValue={initial?.trackId ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="">بدون مسار حاليًا</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            المسار
          </label>
          <p className="text-sm text-slate-500 dark:text-slate-400 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
            سيُنشأ ضمن مسارك الحالي
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          مشرفة الحلقة
        </label>
        <input
          name="supervisorName"
          defaultValue={initial?.supervisorName ?? ""}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اسم مشرفة الحلقة (اختياري)"
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
  );
}
