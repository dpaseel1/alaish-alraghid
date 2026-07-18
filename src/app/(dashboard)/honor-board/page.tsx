import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday } from "@/lib/timezone";
import { PrintButton } from "@/components/reports/PrintButton";
import { TrophyIcon } from "@/components/icons";
import type { Prisma } from "@/generated/prisma/client";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function HonorBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string; from?: string; to?: string; minSessions?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const defaultTo = riyadhToday();
  const defaultFrom = riyadhToday();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromDate = params.from ? new Date(params.from) : defaultFrom;
  fromDate.setHours(0, 0, 0, 0);
  const toDate = params.to ? new Date(params.to) : defaultTo;
  toDate.setHours(23, 59, 59, 999);

  const minSessions = Math.max(1, parseInt(params.minSessions ?? "3", 10) || 3);

  let halaqaWhere: Prisma.HalaqaWhereInput = {};
  if (user.role === "TEACHER") halaqaWhere = { teacherId: user.id };
  else if (user.role === "SUPERVISOR") halaqaWhere = { supervisorId: user.id };

  const halaqaId = user.role === "TEACHER" ? undefined : params.halaqaId || undefined;

  const [halaqatForSelect, students] = await Promise.all([
    user.role === "TEACHER"
      ? Promise.resolve([])
      : db.halaqa.findMany({
          where: { ...halaqaWhere, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
    db.student.findMany({
      where: {
        isActive: true,
        halaqa: { ...halaqaWhere, ...(halaqaId ? { id: halaqaId } : {}) },
      },
      select: {
        id: true,
        name: true,
        halaqa: { select: { name: true } },
        attendanceRecords: {
          where: { attendanceLog: { date: { gte: fromDate, lte: toDate } } },
          select: { present: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const achievers = students
    .map((s) => {
      const total = s.attendanceRecords.length;
      const presentCount = s.attendanceRecords.filter((a) => a.present).length;
      return {
        id: s.id,
        name: s.name,
        halaqaName: s.halaqa.name,
        total,
        presentCount,
      };
    })
    .filter((s) => s.total >= minSessions && s.presentCount === s.total)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "ar"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">لوحة الشرف</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            الطالبات المتميزات بالحضور الكامل خلال الفترة المحددة
          </p>
        </div>
        <PrintButton />
      </div>

      <form
        method="get"
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-wrap items-end gap-4 print:hidden"
      >
        {user.role !== "TEACHER" && (
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
        )}
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
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            حد أدنى لعدد الأيام المسجّلة
          </label>
          <input
            type="number"
            name="minSessions"
            min={1}
            defaultValue={minSessions}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-32"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand text-white text-sm font-medium px-5 py-2 hover:bg-brand-dark transition"
        >
          تصفية
        </button>
      </form>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/30 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          <h2 className="font-semibold text-amber-800">
            متميزات الحضور ({achievers.length}) — من {toDateInputValue(fromDate)} إلى{" "}
            {toDateInputValue(toDate)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-right">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">الطالبة</th>
                <th className="px-5 py-3 font-medium">الحلقة</th>
                <th className="px-5 py-3 font-medium">أيام الحضور المسجّلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {achievers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد طالبات مستوفية لشرط الحضور الكامل في هذه الفترة بعد
                  </td>
                </tr>
              )}
              {achievers.map((s, i) => (
                <tr key={s.id} className="hover:bg-amber-50/60 dark:hover:bg-amber-950/30">
                  <td className="px-5 py-3 text-amber-700 dark:text-amber-400 font-semibold">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.halaqaName}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
