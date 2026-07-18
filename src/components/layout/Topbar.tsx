import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABELS } from "./nav-items";
import type { Role } from "@/generated/prisma/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Topbar({
  name,
  role,
}: {
  name: string;
  role: Role;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 md:px-8">
      <div className="md:hidden flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm shrink-0">
          ق
        </div>
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
          العيش الرغيد
        </span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[role]}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand flex items-center justify-center font-semibold shrink-0">
          {name.charAt(0)}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <span className="hidden sm:inline">تسجيل الخروج</span>
            <span className="sm:hidden">خروج</span>
          </button>
        </form>
      </div>
    </header>
  );
}
