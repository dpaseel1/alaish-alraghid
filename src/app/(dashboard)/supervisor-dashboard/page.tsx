import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday, riyadhFullWeekDays, riyadhHijriMonthRange } from "@/lib/timezone";
import { getSiteSettings } from "@/lib/settings";
import { buildSupervisorDashboard } from "@/lib/supervisorDashboard";
import { SupervisorDashboardInfoCard } from "@/components/reports/SupervisorDashboardInfoCard";
import { SupervisorDashboardTable } from "@/components/reports/SupervisorDashboardTable";
import { SupervisorDashboardExportButton } from "@/components/reports/SupervisorDashboardExportButton";
import { PrintButton } from "@/components/reports/PrintButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { BookIcon, TeacherIcon, ChartIcon, StatsIcon, TrophyIcon } from "@/components/icons";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function SupervisorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string; trackId?: string; from?: string; to?: string; quick?: string }>;
}) {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const params = await searchParams;

  const halaqaId = params.halaqaId || undefined;
  const trackId = user.role === "SUPERVISOR" ? user.supervisedTrackId ?? undefined : params.trackId || undefined;

  const quick = params.quick || (!params.from && !params.to ? "week" : undefined);

  let fromDate: Date;
  let toDate: Date;
  let termNotice: string | null = null;

  if (quick === "month") {
    const range = riyadhHijriMonthRange();
    fromDate = range.start;
    toDate = new Date(range.end);
    toDate.setUTCDate(toDate.getUTCDate() - 1);
  } else if (quick === "term") {
    const settings = await getSiteSettings();
    if (settings?.termStartDate) {
      fromDate = new Date(settings.termStartDate);
      fromDate.setUTCHours(0, 0, 0, 0);
    } else {
      fromDate = riyadhToday();
      fromDate.setUTCDate(fromDate.getUTCDate() - 90);
      termNotice = "لم يُضبَط بعد تاريخ بداية الفصل من صفحة الإعدادات، فتم استخدام آخر 90 يومًا كنطاق مؤقت.";
    }
    toDate = riyadhToday();
  } else if (quick === "week") {
    const week = riyadhFullWeekDays();
    fromDate = week[0];
    toDate = week[6];
  } else {
    const week = riyadhFullWeekDays();
    fromDate = params.from ? new Date(params.from) : week[0];
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate = params.to ? new Date(params.to) : week[6];
    toDate.setUTCHours(0, 0, 0, 0);
  }

  const trackScopeForSelect = user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId ?? "__no_track__" } : trackId ? { trackId } : {};

  const [tracksForSelect, halaqatForSelect, data] = await Promise.all([
    user.role === "SUPERVISOR"
      ? Promise.resolve([])
      : db.track.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.halaqa.findMany({
      where: { ...trackScopeForSelect, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    buildSupervisorDashboard({ user, halaqaId, trackId, from: fromDate, to: toDate }),
  ]);

  function quickHref(q: string) {
    const qs = new URLSearchParams();
    if (halaqaId) qs.set("halaqaId", halaqaId);
    if (trackId && user.role !== "SUPERVISOR") qs.set("trackId", trackId);
    qs.set("quick", q);
    return `/supervisor-dashboard?${qs.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">لوحة الإشراف والمتابعة الشاملة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            أداء الحلقات (حضور، حفظ، مراجعة، سرد) بحسب المسار والفترة الزمنية — من {toDateInputValue(fromDate)} إلى{" "}
            {toDateInputValue(toDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SupervisorDashboardExportButton data={data} />
          <PrintButton />
        </div>
      </div>

      <form
        method="get"
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-wrap items-end gap-4 print:hidden"
      >
        {user.role !== "SUPERVISOR" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">المسار</label>
            <select
              name="trackId"
              defaultValue={trackId ?? ""}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800"
            >
              <option value="">كل المسارات</option>
              {tracksForSelect.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <div className="flex items-center gap-2 text-xs">
          <a href={quickHref("week")} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            هذا الأسبوع
          </a>
          <a href={quickHref("month")} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            هذا الشهر
          </a>
          <a href={quickHref("term")} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            الفصل كامل
          </a>
        </div>
      </form>

      {termNotice && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-400 print:hidden">
          {termNotice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="عدد الطالبات" value={data.summary.totalStudents} icon={<BookIcon className="h-6 w-6" />} />
        <StatCard label="عدد المعلمات" value={data.summary.totalTeachers} icon={<TeacherIcon className="h-6 w-6" />} />
        <StatCard label="إجمالي أوجه الحفظ" value={data.summary.totalMemorized} icon={<ChartIcon className="h-6 w-6" />} />
        <StatCard label="إجمالي المراجعة الكلية" value={data.summary.totalReview} icon={<StatsIcon className="h-6 w-6" />} />
        <StatCard label="إجمالي السرد المستقل" value={data.summary.totalSardIndependent} icon={<TrophyIcon className="h-6 w-6" />} />
      </div>

      {data.halaqat.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
          لا توجد حلقات مطابقة لخيارات التصفية الحالية
        </div>
      )}

      {data.halaqat.map((halaqa) => (
        <div key={halaqa.id} className="space-y-3">
          <SupervisorDashboardInfoCard halaqa={halaqa} />
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <SupervisorDashboardTable halaqa={halaqa} />
          </div>
        </div>
      ))}
    </div>
  );
}
