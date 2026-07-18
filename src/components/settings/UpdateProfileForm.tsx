"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type SettingsActionState,
} from "@/app/actions/settings";

const initialState: SettingsActionState = {};

export function UpdateProfileForm({
  name,
  phone,
  isTeacher,
  nationality,
  age,
  educationLevel,
  residence,
  memorizedAmount,
}: {
  name: string;
  phone: string | null;
  isTeacher?: boolean;
  nationality?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  residence?: string | null;
  memorizedAmount?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
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

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          الاسم
        </label>
        <input
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={100}
          defaultValue={name}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الجوال
        </label>
        <input
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          placeholder="05xxxxxxxx"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      {isTeacher && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            بيانات إضافية <span className="text-slate-400 dark:text-slate-500 font-normal">(تظهر في صفحة الحلقة)</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                الجنسية
              </label>
              <input
                name="nationality"
                type="text"
                defaultValue={nationality ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                العمر
              </label>
              <input
                name="age"
                type="number"
                min={5}
                max={100}
                dir="ltr"
                defaultValue={age ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                المؤهل الدراسي
              </label>
              <input
                name="educationLevel"
                type="text"
                defaultValue={educationLevel ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                مقر الإقامة
              </label>
              <input
                name="residence"
                type="text"
                defaultValue={residence ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              مقدار الحفظ من القرآن الكريم
            </label>
            <input
              name="memorizedAmount"
              type="text"
              placeholder="مثال: حافظة كاملة / 15 جزءًا"
              defaultValue={memorizedAmount ?? ""}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
    </form>
  );
}
