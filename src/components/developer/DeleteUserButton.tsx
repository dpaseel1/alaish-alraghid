"use client";

import { useTransition } from "react";
import { deleteUserByDeveloperAction } from "@/app/actions/developer";

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(`هل أنتِ متأكدة من حذف حساب "${name}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`)
        ) {
          startTransition(() => {
            deleteUserByDeveloperAction(userId);
          });
        }
      }}
      className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
