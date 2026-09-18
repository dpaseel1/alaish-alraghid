import type { HalaqaReport } from "@/lib/supervisorDashboard";
import { dayLabelForIso, cellText } from "@/lib/supervisorDashboardFormat";

export function SupervisorDashboardTable({ halaqa }: { halaqa: HalaqaReport }) {
  const { meetingDates, students, hideMemorizedColumn } = halaqa;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
            <th className="px-3 py-3 font-medium">م</th>
            <th className="px-3 py-3 font-medium sticky right-0 bg-slate-50 dark:bg-slate-900">الاسم</th>
            <th className="px-3 py-3 font-medium">الحضور%</th>
            {meetingDates.map((dateIso) => (
              <th key={dateIso} className="px-3 py-3 font-medium text-center">
                <div>{dayLabelForIso(dateIso)}</div>
                <div className="text-xs font-normal" dir="ltr">
                  {dateIso}
                </div>
              </th>
            ))}
            {!hideMemorizedColumn && <th className="px-3 py-3 font-medium">إجمالي الحفظ</th>}
            <th className="px-3 py-3 font-medium">إجمالي المراجعة اليومية</th>
            <th className="px-3 py-3 font-medium">إجمالي السرد</th>
            <th className="px-3 py-3 font-medium">إجمالي المراجعة الكلية</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {students.length === 0 && (
            <tr>
              <td
                colSpan={4 + meetingDates.length + (hideMemorizedColumn ? 2 : 3)}
                className="px-5 py-8 text-center text-slate-400 dark:text-slate-500"
              >
                لا توجد طالبات مسجّلات في هذه الحلقة
              </td>
            </tr>
          )}
          {students.map((s, i) => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100 sticky right-0 bg-white dark:bg-slate-800">
                {s.name}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.attendance.rate}%</td>
              {s.cells.map((cell) => (
                <td key={cell.dateIso} className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                  {cellText(cell, hideMemorizedColumn)}
                </td>
              ))}
              {!hideMemorizedColumn && (
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.totals.memorized}</td>
              )}
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.totals.dailyReviewed}</td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s.totals.sard}</td>
              <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">{s.totals.reviewTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
