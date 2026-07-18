import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex items-center gap-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
