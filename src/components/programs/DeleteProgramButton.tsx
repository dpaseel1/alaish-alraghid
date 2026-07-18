"use client";

import { useTransition } from "react";
import { deleteProgramAction } from "@/app/actions/programs";

export function DeleteProgramButton({
  programId,
  name,
  className,
}: {
  programId: string;
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
        if (confirm(`هل أنتِ متأكدة من حذف برنامج "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
          startTransition(() => {
            deleteProgramAction(programId);
          });
        }
      }}
      className={className ?? "text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"}
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
