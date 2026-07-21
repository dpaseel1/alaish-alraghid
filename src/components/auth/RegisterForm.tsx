"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  if (state?.success) {
    return (
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 text-sm px-4 py-4 space-y-3">
        <p>{state.success}</p>
        <Link
          href="/login"
          className="inline-block text-brand font-medium hover:underline"
        >
          الذهاب لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          الاسم الرباعي
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="اسمك كما في الهوية"
        />
      </div>

      <div>
        <label htmlFor="nationalId" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الهوية/الإقامة
        </label>
        <input
          id="nationalId"
          name="nationalId"
          type="text"
          inputMode="numeric"
          required
          dir="ltr"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="1XXXXXXXXX"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الجوال <span className="text-slate-400 dark:text-slate-500">(اختياري)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="05XXXXXXXX"
        />
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          بيانات إضافية <span className="text-slate-400 dark:text-slate-500 font-normal">(تظهر في صفحة الحلقة)</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              الجنسية
            </label>
            <input
              id="nationality"
              name="nationality"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              العمر
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={5}
              max={100}
              dir="ltr"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="educationLevel" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              المؤهل الدراسي
            </label>
            <input
              id="educationLevel"
              name="educationLevel"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="residence" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              مقر الإقامة
            </label>
            <input
              id="residence"
              name="residence"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="memorizedAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            مقدار الحفظ من القرآن الكريم
          </label>
          <input
            id="memorizedAmount"
            name="memorizedAmount"
            type="text"
            required
            placeholder="مثال: حافظة كاملة / 15 جزءًا"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="experience" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            الخبرة
          </label>
          <input
            id="experience"
            name="experience"
            type="text"
            required
            placeholder="مثال: ٣ سنوات"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="8 أحرف على الأقل"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          تأكيد كلمة المرور
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand text-white font-medium py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الإنشاء..." : "إنشاء الحساب"}
      </button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-brand font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
