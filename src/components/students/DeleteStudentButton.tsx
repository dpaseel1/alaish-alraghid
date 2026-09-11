"use client";

import { useTransition } from "react";
import { permanentlyDeleteStudentAction } from "@/app/actions/students";

export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
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
            `هل أنتِ متأكدة من حذف الطالبة "${name}" نهائيًا؟ سيُحذف معها كل سجلات الحضور والتسميع والدرجات، ولا يمكن التراجع عن هذا الإجراء.`
          )
        ) {
          startTransition(async () => {
            const result = await permanentlyDeleteStudentAction(studentId);
            if (result?.error) alert(result.error);
          });
        }
      }}
      className="text-xs text-red-700 dark:text-red-500 hover:underline disabled:opacity-50 font-semibold"
    >
      {pending ? "..." : "حذف"}
    </button>
  );
}
