import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday } from "@/lib/timezone";
import { MemorizationChart } from "@/components/reports/MemorizationChart";
import { PrintButton } from "@/components/reports/PrintButton";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string; from?: string; to?: string }>;
}) {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const params = await searchParams;

  const halaqaScope = user.role === "SUPERVISOR" ? { supervisorId: user.id } : {};

  const defaultTo = riyadhToday();
  const defaultFrom = riyadhToday();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromDate = params.from ? new Date(params.from) : defaultFrom;
  fromDate.setHours(0, 0, 0, 0);
  const toDate = params.to ? new Date(params.to) : defaultTo;
  toDate.setHours(23, 59, 59, 999);

  const halaqaId = params.halaqaId || undefined;

  const [halaqatForSelect, halaqat, absentees] = await Promise.all([
    db.halaqa.findMany({
      where: { ...halaqaScope, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.halaqa.findMany({
      where: {
        ...halaqaScope,
        isActive: true,
        ...(halaqaId ? { id: halaqaId } : {}),
      },
      select: {
        id: true,
        name: true,
        students: {
          where: { isActive: true },
          select: { name: true, memorizedPagesTotal: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.studentAttendance.findMany({
      where: {
        present: false,
        student: { isActive: true },
        attendanceLog: {
          date: { gte: fromDate, lte: toDate },
          halaqa: { ...halaqaScope, ...(halaqaId ? { id: halaqaId } : {}) },
        },
      },
      include: {
        student: { select: { name: true } },
        attendanceLog: { select: { date: true, halaqa: { select: { name: true } } } },
      },
      orderBy: { attendanceLog: { date: "desc" } },
      take: 200,
    }),
  ]);

  const halaqaChartData = halaqat.map((h) => ({
    name: h.name,
    value: h.students.reduce((sum, s) => sum + s.memorizedPagesTotal, 0),
  }));

  const singleHalaqa = halaqaId ? halaqat[0] : undefined;
  const studentChartData =
    singleHalaqa?.students
      .slice()
      .sort((a, b) => b.memorizedPagesTotal - a.memorizedPagesTotal)
      .map((s) => ({ name: s.name, value: s.memorizedPagesTotal })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">التقارير والإحصائيات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            مستوى التحصيل في الحفظ وقوائم الغياب القابلة للتصفية
          </p>
        </div>
        <PrintButton />
      </div>

      <form
        method="get"
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-wrap items-end gap-4 print:hidden"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">الحلقة</label>
          <select
            name="halaqaId"
            defaultValue={halaqaId ?? ""}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
          >
            <option value="">كل الحلقات</option>
            {halaqatForSelect.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">من تاريخ</label>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(fromDate)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">إلى تاريخ</label>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(toDate)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand text-white text-sm font-medium px-5 py-2 hover:bg-brand-dark transition"
        >
          تصفية
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          إجمالي الأوجه المحفوظة حسب الحلقة
        </h2>
        <MemorizationChart data={halaqaChartData} barName="إجمالي الأوجه المحفوظة" />
      </div>

      {singleHalaqa && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            توزيع الحفظ بين طالبات {singleHalaqa.name}
          </h2>
          <MemorizationChart
            data={studentChartData}
            barName="الأوجه المحفوظة"
            color="#b45309"
          />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            قائمة الغياب ({absentees.length}) — من {toDateInputValue(fromDate)} إلى{" "}
            {toDateInputValue(toDate)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الطالبة</th>
                <th className="px-5 py-3 font-medium">الحلقة</th>
                <th className="px-5 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {absentees.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد حالات غياب مسجّلة في هذه الفترة
                  </td>
                </tr>
              )}
              {absentees.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {a.student.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {a.attendanceLog.halaqa.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300" dir="ltr">
                    {toDateInputValue(a.attendanceLog.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
