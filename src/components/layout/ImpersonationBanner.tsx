import { getImpersonationView } from "@/lib/session";
import { stopImpersonationAction } from "@/app/actions/impersonate";
import { ROLE_LABELS } from "./nav-items";
import { FlaskIcon } from "@/components/icons";

export async function ImpersonationBanner() {
  const view = await getImpersonationView();
  if (!view) return null;

  const { realUser, targetUser } = view;

  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-2 bg-amber-100 dark:bg-amber-950/50 border-b border-amber-300 dark:border-amber-800 px-4 md:px-8 py-2.5 text-sm text-amber-900 dark:text-amber-200">
      <span className="flex items-center gap-2">
        <FlaskIcon className="h-4 w-4 shrink-0" />
        أنتِ الآن تشاهدين النظام كحساب: <strong>{targetUser.name}</strong> (
        {ROLE_LABELS[targetUser.role]}) — أي إضافة أو تعديل ستُسجَّل باسم هذا الحساب
      </span>
      <form action={stopImpersonationAction}>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 transition whitespace-nowrap"
        >
          العودة لحسابي ({realUser.name})
        </button>
      </form>
    </div>
  );
}
