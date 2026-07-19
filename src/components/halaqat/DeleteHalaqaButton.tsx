"use client";

import { useTransition } from "react";
import { deleteHalaqaAction } from "@/app/actions/halaqat";

export function DeleteHalaqaButton({
  halaqaId,
  name,
  className,
}: {
  halaqaId: string;
  name: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (
          confirm(
            `هل أنتِ متأكدة من حذف حلقة "${name}"؟ لا يمكن حذف الحلقة إذا كان بها طالبات أو سجلات حضور مرتبطة بها. لا يمكن التراجع عن هذا الإجراء.`
          )
        ) {
          startTransition(async () => {
            const result = await deleteHalaqaAction(halaqaId);
            if (result?.error) alert(result.error);
          });
        }
      }}
      className={className ?? "text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"}
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
