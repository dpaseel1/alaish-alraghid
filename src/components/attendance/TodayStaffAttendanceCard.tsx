"use client";

import { useState } from "react";
import { StaffAttendanceDayToggle } from "./StaffAttendanceDayToggle";
import type { StaffAttendanceStatus } from "@/generated/prisma/client";

const STATUS_MESSAGES: Record<"PRESENT" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED", string> = {
  PRESENT: "تم تسجيل حضورك اليوم بنجاح",
  ABSENT_EXCUSED: "تم تسجيل غيابك اليوم (بعذر)",
  ABSENT_UNEXCUSED: "تم تسجيل غيابك اليوم (بدون عذر)",
};

/** بطاقة تحضير المعلمة لنفسها لليوم الحالي فقط، بالصفحة الرئيسية — تعرض حالة اليوم مع إمكانية التعديل،
 * وتستخدم نفس زر التبديل ونفس toggleStaffAttendanceAction المعتمدَين في صفحة /attendance */
export function TodayStaffAttendanceCard({
  todayIso,
  status,
}: {
  todayIso: string;
  status?: StaffAttendanceStatus;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (status === "LEAVE") {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-5">
        <h2 className="font-semibold text-amber-800 dark:text-amber-400 mb-1">تحضيري اليوم</h2>
        <p className="text-sm text-amber-700 dark:text-amber-400">أنتِ في إجازة معتمدة اليوم</p>
      </div>
    );
  }

  const showBanner = status !== undefined && !isEditing;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">تحضيري اليوم</h2>
      {showBanner ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            ✅ {STATUS_MESSAGES[status]}
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-brand hover:underline"
          >
            تعديل
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <StaffAttendanceDayToggle dateIso={todayIso} current={status} />
          {status !== undefined && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              تم
            </button>
          )}
        </div>
      )}
    </div>
  );
}
