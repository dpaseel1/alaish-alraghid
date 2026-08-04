"use client";

import { useTransition } from "react";
import { forceLogoutUserAction } from "@/app/actions/sessions";

/** المطورة حصرًا: زر لإنهاء كل جلسات حساب آخر دفعة واحدة (لحساب مشبوه أو موقوف) */
export function ForceLogoutButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`إنهاء كل الجلسات النشطة لحساب "${name}" على كل الأجهزة؟`)) {
          startTransition(() => {
            forceLogoutUserAction(userId);
          });
        }
      }}
      className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "إنهاء كل الجلسات"}
    </button>
  );
}
