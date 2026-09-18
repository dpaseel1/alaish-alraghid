import type { HalaqaReport } from "@/lib/supervisorDashboard";
import { TRACK_TYPE_LABELS } from "@/lib/trackType";

export function SupervisorDashboardInfoCard({ halaqa }: { halaqa: HalaqaReport }) {
  const t = halaqa.teacherAttendance;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{halaqa.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {halaqa.trackName ?? "بلا مسار"}
            {halaqa.trackType ? ` (${TRACK_TYPE_LABELS[halaqa.trackType]})` : ""}
            {" — "}
            المعلمة: {halaqa.teacherName ?? "غير محددة"}
          </p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 text-right">
          <p>أيام الانعقاد: {halaqa.daysLabel}</p>
          <p>يوم السرد المستنتج: {halaqa.narrationDayLabel}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.rate}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">نسبة التزام المعلمة</p>
        </div>
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{t.present}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">حضور</p>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{t.excused}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">غياب بعذر</p>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
          <p className="text-lg font-bold text-red-700 dark:text-red-400">{t.unexcused}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">غياب بدون عذر</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.leave}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">إجازة</p>
        </div>
      </div>
    </div>
  );
}
