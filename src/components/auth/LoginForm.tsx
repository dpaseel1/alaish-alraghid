"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="nationalId"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
        >
          السجل المدني
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
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
        >
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand text-white font-medium py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        معلمة جديدة؟{" "}
        <Link href="/register" className="text-brand font-medium hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
