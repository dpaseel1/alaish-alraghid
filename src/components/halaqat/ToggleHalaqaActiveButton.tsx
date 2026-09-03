"use client";

import { useTransition } from "react";
import { toggleHalaqaActiveAction } from "@/app/actions/halaqat";

export function ToggleHalaqaActiveButton({
  halaqaId,
  name,
  isActive,
  className,
}: {
  halaqaId: string;
  name: string;
  isActive: boolean;
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
        const message = isActive
          ? `هل أنتِ متأكدة من أرشفة حلقة "${name}"؟ الأرشفة ليست حذفًا، ويمكنك إلغاؤها لاحقًا واستعادة الحلقة في أي وقت.`
          : `هل تودين إلغاء أرشفة حلقة "${name}" وإعادتها للحلقات النشطة؟`;
        if (confirm(message)) {
          startTransition(async () => {
            await toggleHalaqaActiveAction(halaqaId);
          });
        }
      }}
      className={
        className ?? "text-xs text-slate-500 dark:text-slate-400 hover:underline disabled:opacity-50"
      }
    >
      {pending ? "..." : isActive ? "أرشفة" : "إلغاء الأرشفة"}
    </button>
  );
}
