import type { ReactNode } from "react";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({
  label,
  value,
  unit,
  milestone,
  colorClass,
  trackClass,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  milestone: number;
  colorClass: string;
  trackClass: string;
  icon?: ReactNode;
}) {
  const progressInMilestone = milestone > 0 ? value % milestone : 0;
  const percent = milestone > 0 ? (progressInMilestone / milestone) * 100 : 0;
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm flex items-center gap-5">
      <div className="relative shrink-0 h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="9" className={trackClass} />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className={colorClass}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={value > 0 ? offset : CIRCUMFERENCE}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon}
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">
            {value}
          </span>
        </div>
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {value} {unit}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {progressInMilestone} / {milestone} حتى الإنجاز التالي
        </p>
      </div>
    </div>
  );
}
