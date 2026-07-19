"use client";

import { useTransition } from "react";
import { resetLoginLockoutAction } from "@/app/actions/developer";

export function ResetLoginLockoutButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`إعادة ضبط محاولات الدخول الفاشلة لحساب "${name}" وإلغاء الإيقاف المؤقت؟`)) {
          startTransition(() => {
            resetLoginLockoutAction(userId);
          });
        }
      }}
      className="text-xs text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "إعادة ضبط محاولات الدخول"}
    </button>
  );
}
