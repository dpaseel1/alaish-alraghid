"use client";

import { toggleStaffAttendanceAction } from "@/app/actions/staffAttendance";
import type { StaffAttendanceStatus } from "@/generated/prisma/client";

type WeekDay = { iso: string; label: string };

const OPTIONS: { status: StaffAttendanceStatus; title: string; symbol: string; activeClass: string; idleClass: string }[] = [
  {
    status: "PRESENT",
    title: "حاضرة",
    symbol: "✓",
    activeClass: "bg-emerald-600 text-white",
    idleClass: "bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  {
    status: "ABSENT",
    title: "غائبة",
    symbol: "✕",
    activeClass: "bg-red-600 text-white",
    idleClass: "bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
  },
  {
    status: "LEAVE",
    title: "إجازة",
    symbol: "◐",
    activeClass: "bg-amber-500 text-white",
    idleClass: "bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
];

export function StaffWeeklyGrid({
  weekDays,
  attendance,
}: {
  weekDays: WeekDay[];
  attendance: Record<string, StaffAttendanceStatus>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {weekDays.map((day) => {
        const current = attendance[day.iso];
        return (
          <div key={day.iso} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{day.label}</span>
            <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
              {OPTIONS.map((opt) => (
                <form key={opt.status} action={toggleStaffAttendanceAction.bind(null, day.iso, opt.status)}>
                  <button
                    type="submit"
                    title={opt.title}
                    className={`flex h-7 w-7 items-center justify-center text-xs font-bold ${
                      current === opt.status ? opt.activeClass : opt.idleClass
                    }`}
                  >
                    {opt.symbol}
                  </button>
                </form>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
