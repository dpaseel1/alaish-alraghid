import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday, riyadhWeekDays } from "@/lib/timezone";
import { HALAQA_DAYS } from "@/lib/halaqaDays";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendChart } from "@/components/statistics/TrendChart";
import { MemorizationChart } from "@/components/reports/MemorizationChart";
import { BookIcon, TrophyIcon, CalendarIcon, MosqueIcon, LogIcon } from "@/components/icons";

const WEEKS_COUNT = 12;

function weekStartUTC(d: Date): Date {
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function weekLabel(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default async function StatisticsPage() {
  const user = await requireUser();

  const halaqaScope: Record<string, unknown> = { isActive: true };
  if (user.role === "SUPERVISOR") {
    halaqaScope.trackId = user.supervisedTrackId ?? "__no_track__";
  } else if (user.role === "TEACHER") {
    const own = await db.halaqa.findUnique({ where: { teacherId: user.id } });
    if (!own) {
      return (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-700 dark:text-amber-400">
          لا توجد حلقة مرتبطة بحسابك بعد. تواصلي مع المشرفة أو المديرة.
        </div>
      );
    }
    halaqaScope.id = own.id;
  }

  const today = riyadhToday();
  const currentWeekStart = riyadhWeekDays()[0];
  const rangeStart = new Date(currentWeekStart);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 7 * (WEEKS_COUNT - 1));

  const [halaqat, students, memorizationRecords, attendanceRecords, submittedTodayLogs] = await Promise.all([
    db.halaqa.findMany({
      where: halaqaScope,
      select: { id: true, name: true, trackId: true, track: { select: { name: true } }, days: true },
      orderBy: { name: "asc" },
    }),
    db.student.findMany({
      where: { isActive: true, halaqa: halaqaScope },
      select: { id: true, halaqaId: true, memorizedPagesTotal: true },
    }),
    db.memorizationRecord.findMany({
      where: { date: { gte: rangeStart }, student: { isActive: true, halaqa: halaqaScope } },
      select: { date: true, pagesMemorized: true },
    }),
    db.studentAttendance.findMany({
      where: {
        student: { isActive: true },
        attendanceLog: { date: { gte: rangeStart }, halaqa: halaqaScope },
      },
      select: { present: true, attendanceLog: { select: { date: true } } },
    }),
    db.attendanceLog.findMany({
      where: { date: today, dataSubmitted: true, halaqa: halaqaScope },
      select: { halaqaId: true },
    }),
  ]);

  // ===== بطاقات KPI =====
  const totalStudents = students.length;
  const avgPages = totalStudents
    ? Math.round((students.reduce((sum, s) => sum + s.memorizedPagesTotal, 0) / totalStudents) * 10) / 10
    : 0;

  const last30Start = new Date(today);
  last30Start.setUTCDate(last30Start.getUTCDate() - 29);
  const attendanceLast30 = attendanceRecords.filter(
    (a) => a.attendanceLog.date.getTime() >= last30Start.getTime()
  );
  const attendanceRate = attendanceLast30.length
    ? Math.round((attendanceLast30.filter((a) => a.present).length / attendanceLast30.length) * 1000) / 10
    : 0;

  const submittedTodaySet = new Set(submittedTodayLogs.map((l) => l.halaqaId));
  const todayCode = HALAQA_DAYS[today.getUTCDay()];
  const unsubmittedHalaqatToday = halaqat.filter((h) => {
    const scheduledDays = h.days.length > 0 ? new Set(h.days) : null;
    const isScheduledToday = scheduledDays ? scheduledDays.has(todayCode) : today.getUTCDay() <= 4;
    return isScheduledToday && !submittedTodaySet.has(h.id);
  });

  // ===== اتجاه الأداء عبر الوقت (12 أسبوعًا) =====
  const weekBuckets: { start: Date; label: string }[] = Array.from({ length: WEEKS_COUNT }, (_, i) => {
    const start = new Date(rangeStart);
    start.setUTCDate(start.getUTCDate() + i * 7);
    return { start, label: weekLabel(start) };
  });

  const pagesPerWeek = new Map<string, number>();
  const attendancePresentPerWeek = new Map<string, number>();
  const attendanceTotalPerWeek = new Map<string, number>();

  for (const r of memorizationRecords) {
    const key = weekStartUTC(r.date).toISOString();
    pagesPerWeek.set(key, (pagesPerWeek.get(key) ?? 0) + r.pagesMemorized);
  }
  for (const a of attendanceRecords) {
    const key = weekStartUTC(a.attendanceLog.date).toISOString();
    attendanceTotalPerWeek.set(key, (attendanceTotalPerWeek.get(key) ?? 0) + 1);
    if (a.present) attendancePresentPerWeek.set(key, (attendancePresentPerWeek.get(key) ?? 0) + 1);
  }

  const performanceTrend = weekBuckets.map((w) => ({
    label: w.label,
    value: pagesPerWeek.get(w.start.toISOString()) ?? 0,
  }));

  const attendanceTrend = weekBuckets.map((w) => {
    const key = w.start.toISOString();
    const total = attendanceTotalPerWeek.get(key) ?? 0;
    const present = attendancePresentPerWeek.get(key) ?? 0;
    return { label: w.label, value: total ? Math.round((present / total) * 1000) / 10 : 0 };
  });

  // ===== مقارنة الحلقات والمسارات =====
  const pagesByHalaqa = new Map<string, number>();
  for (const s of students) {
    pagesByHalaqa.set(s.halaqaId, (pagesByHalaqa.get(s.halaqaId) ?? 0) + s.memorizedPagesTotal);
  }
  const halaqaChartData = halaqat.map((h) => ({ name: h.name, value: pagesByHalaqa.get(h.id) ?? 0 }));

  const pagesByTrack = new Map<string, number>();
  for (const h of halaqat) {
    const trackName = h.track?.name ?? "بدون مسار";
    pagesByTrack.set(trackName, (pagesByTrack.get(trackName) ?? 0) + (pagesByHalaqa.get(h.id) ?? 0));
  }
  const trackChartData = Array.from(pagesByTrack.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">لوحة الإحصاءات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          نظرة تنفيذية شاملة على الأداء والحضور والالتزام
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="الطالبات النشطات" value={totalStudents} icon={<BookIcon className="h-6 w-6" />} />
        <StatCard
          label="متوسط الأوجه المحفوظة/طالبة"
          value={avgPages}
          icon={<TrophyIcon className="h-6 w-6" />}
        />
        <StatCard
          label="نسبة الحضور (٣٠ يوم)"
          value={`${attendanceRate}%`}
          icon={<CalendarIcon className="h-6 w-6" />}
        />
        <StatCard label="الحلقات النشطة" value={halaqat.length} icon={<MosqueIcon className="h-6 w-6" />} />
        <StatCard
          label="حلقات لم تُسجّل بيانات اليوم"
          value={unsubmittedHalaqatToday.length}
          icon={<LogIcon className="h-6 w-6" />}
          detailsLabel={unsubmittedHalaqatToday.length > 0 ? "عرض الأسماء" : undefined}
          detailsContent={
            unsubmittedHalaqatToday.length > 0 ? (
              <ul className="space-y-1 list-disc pr-4">
                {unsubmittedHalaqatToday.map((h) => (
                  <li key={h.id}>{h.name}</li>
                ))}
              </ul>
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            اتجاه الأداء (الأوجه المحفوظة أسبوعيًا)
          </h2>
          <TrendChart data={performanceTrend} lineName="الأوجه المحفوظة" />
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">اتجاه نسبة الحضور أسبوعيًا</h2>
          <TrendChart data={attendanceTrend} lineName="نسبة الحضور" color="#b45309" valueSuffix="%" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            مقارنة إجمالي الأوجه المحفوظة حسب الحلقة
          </h2>
          <MemorizationChart data={halaqaChartData} barName="إجمالي الأوجه المحفوظة" />
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            مقارنة إجمالي الأوجه المحفوظة حسب المسار
          </h2>
          <MemorizationChart data={trackChartData} barName="إجمالي الأوجه المحفوظة" color="#0369a1" />
        </div>
      </div>
    </div>
  );
}
