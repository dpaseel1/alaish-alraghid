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

  const [activeHalaqatCount, totalStudents, onlineTeachers, tracks, halaqat] =
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
      db.track.findMany({ orderBy: { createdAt: "asc" } }),
      db.halaqa.findMany({
        where: halaqaWhere,
        select: {
          id: true,
          trackId: true,
          teacherId: true,
          supervisorId: true,
          students: { where: { isActive: true }, select: { memorizedPagesTotal: true } },
        },
      }),
    ]);

  type TrackStats = {
    id: string | null;
    name: string;
    halaqatCount: number;
    teachersCount: number;
    supervisorsCount: number;
    studentsCount: number;
    memorizedTotal: number;
  };

  const statsByTrack = new Map<string | null, TrackStats>();
  for (const t of tracks) {
    statsByTrack.set(t.id, {
      id: t.id,
      name: t.name,
      halaqatCount: 0,
      teachersCount: 0,
      supervisorsCount: 0,
      studentsCount: 0,
      memorizedTotal: 0,
    });
  }

  const teacherSets = new Map<string | null, Set<string>>();
  const supervisorSets = new Map<string | null, Set<string>>();

  for (const h of halaqat) {
    const key = h.trackId ?? null;
    if (!statsByTrack.has(key)) {
      statsByTrack.set(key, {
        id: key,
        name: "حلقات غير مصنّفة ضمن مسار",
        halaqatCount: 0,
        teachersCount: 0,
        supervisorsCount: 0,
        studentsCount: 0,
        memorizedTotal: 0,
      });
    }
    const stats = statsByTrack.get(key)!;
    stats.halaqatCount += 1;
    stats.studentsCount += h.students.length;
    stats.memorizedTotal += h.students.reduce((sum, s) => sum + s.memorizedPagesTotal, 0);

    if (h.teacherId) {
      if (!teacherSets.has(key)) teacherSets.set(key, new Set());
      teacherSets.get(key)!.add(h.teacherId);
    }
    if (h.supervisorId) {
      if (!supervisorSets.has(key)) supervisorSets.set(key, new Set());
      supervisorSets.get(key)!.add(h.supervisorId);
    }
  }

  for (const [key, stats] of statsByTrack) {
    stats.teachersCount = teacherSets.get(key)?.size ?? 0;
    stats.supervisorsCount = supervisorSets.get(key)?.size ?? 0;
  }

  const orderedStats = [
    ...tracks.map((t) => statsByTrack.get(t.id)!),
    ...(statsByTrack.has(null) ? [statsByTrack.get(null)!] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الرئيسية</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على المسارات والحلقات والطالبات</p>
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">المسارات</h2>
          <Link href="/halaqat" className="text-sm text-brand font-medium hover:underline">
            عرض كل الحلقات
          </Link>
        </div>

        {orderedStats.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
            لا توجد مسارات أو حلقات مضافة بعد
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedStats.map((t) => (
            <Link
              key={t.id ?? "unassigned"}
              href={`/tracks/${t.id ?? "unassigned"}`}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm hover:shadow-md hover:border-brand transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-xl">
                  🧭
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p>🕌 {t.halaqatCount} حلقة</p>
                <p>📚 {t.studentsCount} طالبة</p>
                <p>👩‍🏫 {t.teachersCount} معلمة</p>
                <p>🧭 {t.supervisorsCount} مشرفة</p>
                <p className="col-span-2">📖 {t.memorizedTotal} وجه محفوظ</p>
              </div>
            </Link>
          ))}
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
