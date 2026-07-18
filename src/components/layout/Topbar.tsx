import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABELS } from "./nav-items";
import type { Role } from "@/generated/prisma/client";

export function Topbar({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur px-4 md:px-8">
      <div className="md:hidden flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
          ق
        </div>
        <span className="font-semibold text-slate-800 text-sm">حلقات التحفيظ</span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="text-left">
          <p className="text-sm font-medium text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-semibold">
          {name.charAt(0)}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-red-50"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </header>
  );
}
