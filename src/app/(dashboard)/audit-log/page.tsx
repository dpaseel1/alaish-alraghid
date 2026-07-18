import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday } from "@/lib/timezone";
import { formatRiyadhDateTime } from "@/lib/dateFormat";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import type { Prisma, Role } from "@/generated/prisma/client";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; from?: string; to?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const defaultTo = riyadhToday();
  const defaultFrom = riyadhToday();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromDate = params.from ? new Date(params.from) : defaultFrom;
  fromDate.setHours(0, 0, 0, 0);
  const toDate = params.to ? new Date(params.to) : defaultTo;
  toDate.setHours(23, 59, 59, 999);

  const role = params.role as Role | undefined;
  const q = params.q?.trim();

  const where: Prisma.AuditLogWhereInput = {
    createdAt: { gte: fromDate, lte: toDate },
    ...(role ? { actorRole: role } : {}),
    ...(q
      ? {
          OR: [
            { actorName: { contains: q } },
            { targetLabel: { contains: q } },
            { message: { contains: q } },
          ],
        }
      : {}),
  };

  const entries = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">سجل الحركات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          كل عمليات الإضافة والتعديل والحذف التي قام بها المستخدمون
        </p>
      </div>

      <form
        method="get"
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">الصفة</label>
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
          >
            <option value="">الكل</option>
            <option value="DEVELOPER">مطورة</option>
            <option value="ADMIN">مديرة</option>
            <option value="SUPERVISOR">مشرفة</option>
            <option value="TEACHER">معلمة</option>
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
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">بحث</label>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="اسم المستخدمة أو الطالبة..."
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

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            العمليات ({entries.length}
            {entries.length === 300 ? "+" : ""}) — من {toDateInputValue(fromDate)} إلى{" "}
            {toDateInputValue(toDate)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">التاريخ والوقت</th>
                <th className="px-5 py-3 font-medium">المستخدمة</th>
                <th className="px-5 py-3 font-medium">الصفة</th>
                <th className="px-5 py-3 font-medium">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد حركات مسجّلة في هذه الفترة
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                    {formatRiyadhDateTime(e.createdAt)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {e.actorName}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {ROLE_LABELS[e.actorRole]}
                  </td>
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-200">
                    {e.message}{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-50">{e.targetLabel}</span>
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
