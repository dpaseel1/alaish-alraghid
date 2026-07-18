import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";

const ONLINE_THRESHOLD_MINUTES = 15;

export default async function HomePage() {
  const user = await requireUser();

  if (user.role === "TEACHER") {
    return <TeacherHome teacherId={user.id} />;
  }

  return <AdminOrSupervisorHome supervisorId={user.role === "SUPERVISOR" ? user.id : undefined} />;
}

async function AdminOrSupervisorHome({
  supervisorId,
}: {
  supervisorId?: string;
}) {
  const halaqaWhere = supervisorId ? { supervisorId } : {};
  const onlineSince = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

  const [activeHalaqatCount, totalStudents, onlineTeachers, halaqat] =
    await Promise.all([
      db.halaqa.count({ where: { ...halaqaWhere, isActive: true } }),
      db.student.count({
        where: { isActive: true, halaqa: supervisorId ? { supervisorId } : undefined },
      }),
      db.user.count({
        where: {
          role: "TEACHER",
          status: "ACTIVE",
          lastSeenAt: { gte: onlineSince },
          ...(supervisorId
            ? { teacherHalaqa: { supervisorId } }
            : {}),
        },
      }),
      db.halaqa.findMany({
        where: halaqaWhere,
        include: {
          teacher: { select: { name: true } },
          supervisor: { select: { name: true } },
          _count: { select: { students: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الرئيسية</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على الحلقات والطالبات</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="عدد الحلقات النشطة" value={activeHalaqatCount} icon="🕌" />
        <StatCard label="إجمالي عدد الطالبات" value={totalStudents} icon="📚" />
        <StatCard
          label="معلمات متصلات حاليًا"
          value={onlineTeachers}
          icon="🟢"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">الحلقات</h2>
          <Link
            href="/halaqat"
            className="text-sm text-brand font-medium hover:underline"
          >
            عرض كل الحلقات
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">اسم الحلقة</th>
                <th className="px-5 py-3 font-medium">المعلمة</th>
                <th className="px-5 py-3 font-medium">المشرفة</th>
                <th className="px-5 py-3 font-medium">عدد الطالبات</th>
                <th className="px-5 py-3 font-medium">وقت الحلقة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqat.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد حلقات مضافة بعد
                  </td>
                </tr>
              )}
              {halaqat.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{h.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.teacher?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.supervisor?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h._count.students}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.time}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/halaqat/${h.id}`}
                      className="text-brand hover:underline ml-3"
                    >
                      عرض
                    </Link>
                    <Link
                      href={`/halaqat/${h.id}/edit`}
                      className="text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      تعديل
                    </Link>
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

async function TeacherHome({ teacherId }: { teacherId: string }) {
  const halaqa = await db.halaqa.findUnique({
    where: { teacherId },
    include: {
      supervisor: { select: { name: true } },
      students: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  if (!halaqa) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800">
        لم يتم تعيين حلقة لحسابك بعد. يرجى التواصل مع المديرة لربط حسابك
        بالحلقة الخاصة بك.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{halaqa.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {halaqa.time} · المشرفة: {halaqa.supervisor?.name ?? "—"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="عدد الطالبات" value={halaqa.students.length} icon="📚" />
        <Link
          href="/students"
          className="rounded-2xl border border-brand bg-brand text-white p-5 flex items-center justify-center gap-2 font-medium shadow-sm hover:bg-brand-dark transition"
        >
          ✏️ تسجيل بيانات اليوم
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">طالبات الحلقة</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجنسية</th>
                <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                <th className="px-5 py-3 font-medium">النصاب الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqa.students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد طالبات مضافات بعد
                  </td>
                </tr>
              )}
              {halaqa.students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.nationality}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.memorizedPagesTotal}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.currentQuota ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
