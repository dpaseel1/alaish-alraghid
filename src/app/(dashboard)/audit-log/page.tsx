import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import type { Prisma, Role } from "@/generated/prisma/client";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date) {
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; from?: string; to?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const defaultTo = new Date();
  const defaultFrom = new Date();
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
        <h1 className="text-xl font-bold text-slate-800">سجل الحركات</h1>
        <p className="text-sm text-slate-500 mt-1">
          كل عمليات الإضافة والتعديل والحذف التي قام بها المستخدمون
        </p>
      </div>

      <form
        method="get"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-end gap-4"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">الصفة</label>
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">الكل</option>
            <option value="ADMIN">مديرة</option>
            <option value="SUPERVISOR">مشرفة</option>
            <option value="TEACHER">معلمة</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">من تاريخ</label>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(fromDate)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">إلى تاريخ</label>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(toDate)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">بحث</label>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="اسم المستخدمة أو الطالبة..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand text-white text-sm font-medium px-5 py-2 hover:bg-brand-dark transition"
        >
          تصفية
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">
            العمليات ({entries.length}
            {entries.length === 300 ? "+" : ""}) — من {toDateInputValue(fromDate)} إلى{" "}
            {toDateInputValue(toDate)}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-right">
                <th className="px-5 py-3 font-medium">التاريخ والوقت</th>
                <th className="px-5 py-3 font-medium">المستخدمة</th>
                <th className="px-5 py-3 font-medium">الصفة</th>
                <th className="px-5 py-3 font-medium">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    لا توجد حركات مسجّلة في هذه الفترة
                  </td>
                </tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap" dir="ltr">
                    {formatDateTime(e.createdAt)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {e.actorName}
                  </td>
                  <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                    {ROLE_LABELS[e.actorRole]}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {e.message}{" "}
                    <span className="font-medium text-slate-900">{e.targetLabel}</span>
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
