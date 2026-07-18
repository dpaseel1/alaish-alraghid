"use client";

import { useActionState } from "react";
import { revealNationalIdAction } from "@/app/actions/teachers";

export function RevealNationalId({
  userId,
  lastFour,
}: {
  userId: string;
  lastFour: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { nationalId?: string; error?: string } | undefined,
      _formData: FormData
    ) => {
      const result = await revealNationalIdAction(userId);
      return "error" in result ? { error: result.error } : { nationalId: result.nationalId };
    },
    undefined
  );

  if (state?.nationalId) {
    return <span dir="ltr" className="font-mono text-slate-800">{state.nationalId}</span>;
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <span dir="ltr" className="font-mono text-slate-400">•••••{lastFour}</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-brand hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "إظهار"}
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
