"use client";

import { toggleStaffAttendanceAction } from "@/app/actions/staffAttendance";
import type { StaffAttendanceStatus } from "@/generated/prisma/client";

type WeekDay = { iso: string; label: string };

const IS_ABSENT = (status: StaffAttendanceStatus | undefined) =>
  status === "ABSENT_EXCUSED" || status === "ABSENT_UNEXCUSED";

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
            {current === "LEAVE" ? (
              <span
                title="إجازة معتمدة من المديرة"
                className="flex h-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-medium px-2"
              >
                إجازة
              </span>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                  <form action={toggleStaffAttendanceAction.bind(null, day.iso, "PRESENT")}>
                    <button
                      type="submit"
                      title="حاضرة"
                      className={`flex h-7 w-7 items-center justify-center text-sm font-bold ${
                        current === "PRESENT"
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-slate-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      }`}
                    >
                      ✓
                    </button>
                  </form>
                  <form action={toggleStaffAttendanceAction.bind(null, day.iso, "ABSENT_UNEXCUSED")}>
                    <button
                      type="submit"
                      title="غائبة"
                      className={`flex h-7 w-7 items-center justify-center text-sm font-bold ${
                        IS_ABSENT(current)
                          ? "bg-red-600 text-white"
                          : "bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      }`}
                    >
                      ✗
                    </button>
                  </form>
                </div>
                {IS_ABSENT(current) && (
                  <div className="flex items-center rounded-md overflow-hidden border border-slate-200 dark:border-slate-600 text-[10px]">
                    <form action={toggleStaffAttendanceAction.bind(null, day.iso, "ABSENT_EXCUSED")}>
                      <button
                        type="submit"
                        title="غياب بعذر"
                        className={`px-1.5 py-0.5 font-medium ${
                          current === "ABSENT_EXCUSED"
                            ? "bg-amber-600 text-white"
                            : "bg-white dark:bg-slate-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                      >
                        بعذر
                      </button>
                    </form>
                    <form action={toggleStaffAttendanceAction.bind(null, day.iso, "ABSENT_UNEXCUSED")}>
                      <button
                        type="submit"
                        title="غياب بدون عذر"
                        className={`px-1.5 py-0.5 font-medium ${
                          current === "ABSENT_UNEXCUSED"
                            ? "bg-red-600 text-white"
                            : "bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        }`}
                      >
                        بدون
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
