"use client";

import { useActionState } from "react";
import { revealStudentNationalIdAction } from "@/app/actions/students";

export function RevealStudentNationalId({
  studentId,
  lastFour,
}: {
  studentId: string;
  lastFour: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { nationalId?: string; error?: string } | undefined,
      _formData: FormData
    ) => {
      const result = await revealStudentNationalIdAction(studentId);
      return "error" in result ? { error: result.error } : { nationalId: result.nationalId };
    },
    undefined
  );

  if (!lastFour) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  if (state?.nationalId) {
    return <span dir="ltr" className="font-mono text-slate-800 dark:text-slate-100">{state.nationalId}</span>;
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <span dir="ltr" className="font-mono text-slate-400 dark:text-slate-500">•••••{lastFour}</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-brand hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "إظهار"}
      </button>
      {state?.error && <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>}
    </form>
  );
}
