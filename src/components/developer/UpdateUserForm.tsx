"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  updateUserByDeveloperAction,
  type DeveloperActionState,
} from "@/app/actions/developer";
import type { Role, UserStatus } from "@/generated/prisma/client";

const initialState: DeveloperActionState = {};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "TEACHER", label: "معلمة" },
  { value: "SUPERVISOR", label: "مشرفة" },
  { value: "ADMIN", label: "مديرة" },
  { value: "DEVELOPER", label: "مطورة" },
];

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "PENDING", label: "بانتظار الموافقة" },
  { value: "ACTIVE", label: "مفعّل" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "SUSPENDED", label: "موقوف" },
];

export function UpdateUserForm({
  userId,
  name,
  nationalId,
  phone,
  role,
  status,
  nationality,
  age,
  educationLevel,
  residence,
  memorizedAmount,
}: {
  userId: string;
  name: string;
  nationalId: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  nationality?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  residence?: string | null;
  memorizedAmount?: string | null;
}) {
  const boundAction = updateUserByDeveloperAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
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
          required
          defaultValue={name}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
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
          defaultValue={nationalId}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الجوال
        </label>
        <input
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={phone ?? ""}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            الصفة
          </label>
          <select
            name="role"
            required
            defaultValue={role}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            الحالة
          </label>
          <select
            name="status"
            required
            defaultValue={status}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          بيانات إضافية <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري - للمعلمات)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">الجنسية</label>
            <input name="nationality" type="text" defaultValue={nationality ?? ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">العمر</label>
            <input name="age" type="number" min={5} max={100} dir="ltr" defaultValue={age ?? ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">المؤهل الدراسي</label>
            <input name="educationLevel" type="text" defaultValue={educationLevel ?? ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">مقر الإقامة</label>
            <input name="residence" type="text" defaultValue={residence ?? ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">مقدار الحفظ من القرآن الكريم</label>
          <input name="memorizedAmount" type="text" placeholder="مثال: حافظة كاملة / 15 جزءًا" defaultValue={memorizedAmount ?? ""} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          كلمة مرور جديدة (اختياري)
        </label>
        <input
          name="newPassword"
          type="password"
          minLength={8}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اتركيه فارغًا للإبقاء على كلمة المرور الحالية"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
        >
          {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
        <Link
          href="/developer"
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
