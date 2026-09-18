"use client";

import { StaffAttendanceDayToggle } from "./StaffAttendanceDayToggle";
import type { StaffAttendanceStatus } from "@/generated/prisma/client";

type WeekDay = { iso: string; label: string };

export function StaffWeeklyGrid({
  weekDays,
  attendance,
}: {
  weekDays: WeekDay[];
  attendance: Record<string, StaffAttendanceStatus>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {weekDays.map((day) => (
        <StaffAttendanceDayToggle key={day.iso} dateIso={day.iso} label={day.label} current={attendance[day.iso]} />
      ))}
    </div>
  );
}
