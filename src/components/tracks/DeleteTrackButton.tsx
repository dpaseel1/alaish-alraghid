"use client";

import { useTransition } from "react";
import { deleteTrackAction } from "@/app/actions/tracks";

export function DeleteTrackButton({
  trackId,
  name,
  className,
}: {
  trackId: string;
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
            `هل أنتِ متأكدة من حذف مسار "${name}"؟ ستبقى الحلقات التابعة له موجودة بدون مسار. لا يمكن التراجع عن هذا الإجراء.`
          )
        ) {
          startTransition(() => {
            deleteTrackAction(trackId);
          });
        }
      }}
      className={className ?? "text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"}
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
