import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isAdminRole } from "@/lib/session";
import { db } from "@/lib/db";

function formatWeekRange(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ar-SA", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
  return `${fmt(weekStart)} — ${fmt(weekEnd)}`;
}

export default async function HalaqaRecitationHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const halaqa = await db.halaqa.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      teacherId: true,
      trackId: true,
      recitationEnabled: true,
      students: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, reviewedPagesTotal: true },
      },
    },
  });

  if (!halaqa) notFound();

  const canView =
    isAdminRole(user.role) ||
    (user.role === "SUPERVISOR" && !!user.supervisedTrackId && halaqa.trackId === user.supervisedTrackId) ||
    (user.role === "TEACHER" && halaqa.teacherId === user.id);

  if (!canView) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-red-700 dark:text-red-400">
        لا تملكين صلاحية عرض هذه الحلقة
      </div>
    );
  }

  const studentIds = halaqa.students.map((s) => s.id);
  const records =
    studentIds.length > 0
      ? await db.weeklyRecitation.findMany({
          where: { studentId: { in: studentIds } },
          orderBy: [{ weekStart: "desc" }],
          select: {
            id: true,
            studentId: true,
            weekStart: true,
            recited: true,
            pagesRecorded: true,
          },
        })
      : [];

  const studentNames = new Map(halaqa.students.map((s) => [s.id, s.name]));
  const rows = records
    .map((r) => ({ ...r, studentName: studentNames.get(r.studentId) ?? "—" }))
    .sort(
      (a, b) =>
        b.weekStart.getTime() - a.weekStart.getTime() ||
        a.studentName.localeCompare(b.studentName, "ar")
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          السجل الأسبوعي الكامل للمراجعة — {halaqa.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          جميع أسابيع المراجعة المسجَّلة لطالبات الحلقة، أسبوعًا بعد أسبوع، دون حذف أي بيانات سابقة
        </p>
        <Link href={`/halaqat/${halaqa.id}`} className="inline-block mt-2 text-sm text-brand hover:underline">
          ← رجوع لصفحة الحلقة
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الأسبوع</th>
                <th className="px-5 py-3 font-medium">الطالبة</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">عدد الأوجه المسجَّلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا يوجد سجل مراجعة بعد لطالبات هذه الحلقة
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatWeekRange(r.weekStart)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{r.studentName}</td>
                  <td className="px-5 py-3">
                    {r.recited ? (
                      <span className="rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-2.5 py-1 text-xs font-medium">
                        سردت
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 text-xs font-medium">
                        لم تسرد
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.pagesRecorded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
