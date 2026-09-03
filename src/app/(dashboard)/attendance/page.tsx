import { requireUser, isAdminRole } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhWeekDays, riyadhFullWeekDays, riyadhToday } from "@/lib/timezone";
import { HALAQA_DAYS, HALAQA_DAY_LABELS } from "@/lib/halaqaDays";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import { StaffWeeklyGrid } from "@/components/attendance/StaffWeeklyGrid";
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm";
import { LeaveRequestsTable } from "@/components/attendance/LeaveRequestsTable";
import { ExportButton } from "@/components/export/ExportButton";
import type { StaffAttendanceStatus } from "@/generated/prisma/client";

const WEEKDAY_LABELS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

const LEAVE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
};

const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار الموافقة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
};

const STAFF_STATUS_LABELS: Record<StaffAttendanceStatus, string> = {
  PRESENT: "حاضرة",
  ABSENT: "غائبة",
  LEAVE: "إجازة",
};

const STAFF_STATUS_STYLES: Record<StaffAttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  ABSENT: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  LEAVE: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
};

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const isStaff = user.role === "TEACHER" || user.role === "SUPERVISOR";
  const isAdmin = isAdminRole(user.role);
  const canExportStudents = isAdmin || user.role === "SUPERVISOR";
  const { from, to } = await searchParams;

  const weekDayDates = riyadhWeekDays();
  const weekDays = weekDayDates.map((d, i) => ({ iso: toIso(d), label: WEEKDAY_LABELS[i] }));

  // حضور المعلمة الشخصي مقيّد بأيام انعقاد حلقتها (وقد تشمل الجمعة/السبت)؛ المشرفة أو المعلمة بلا أيام محددة تبقى على الأحد-الخميس
  const myHalaqa =
    user.role === "TEACHER"
      ? await db.halaqa.findUnique({ where: { teacherId: user.id }, select: { days: true } })
      : null;
  const myScheduledDays = myHalaqa && myHalaqa.days.length > 0 ? new Set(myHalaqa.days) : null;
  const fullWeek = riyadhFullWeekDays();
  const myWeekDayDates = myScheduledDays
    ? fullWeek.filter((d) => myScheduledDays.has(HALAQA_DAYS[d.getUTCDay()]))
    : weekDayDates;
  const myWeekDays = myScheduledDays
    ? myWeekDayDates.map((d) => ({ iso: toIso(d), label: HALAQA_DAY_LABELS[HALAQA_DAYS[d.getUTCDay()]] }))
    : weekDays;

  const exportDefaultTo = riyadhToday();
  const exportDefaultFrom = riyadhToday();
  exportDefaultFrom.setDate(exportDefaultFrom.getDate() - 30);
  const exportFrom = from || toIso(exportDefaultFrom);
  const exportTo = to || toIso(exportDefaultTo);
  const exportQuery = new URLSearchParams({ from: exportFrom, to: exportTo }).toString();
  const thisWeekFrom = weekDays[0]?.iso ?? toIso(riyadhToday());
  const thisWeekTo = weekDays[weekDays.length - 1]?.iso ?? toIso(riyadhToday());

  const [myWeekAttendance, myLeaveRequests, pendingRequests, weeklyStaffSummary] = await Promise.all([
    isStaff
      ? db.staffAttendance.findMany({
          where: { userId: user.id, date: { in: myWeekDayDates } },
        })
      : Promise.resolve([]),
    isStaff
      ? db.leaveRequest.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    (isAdmin || user.role === "SUPERVISOR") && !(user.role === "SUPERVISOR" && !user.supervisedTrackId)
      ? db.leaveRequest.findMany({
          where: {
            status: "PENDING",
            ...(user.role === "SUPERVISOR"
              ? { user: { role: "TEACHER", teacherHalaqa: { trackId: user.supervisedTrackId } } }
              : {}),
          },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    isAdmin
      ? db.user.findMany({
          where: { role: { in: ["TEACHER", "SUPERVISOR"] }, status: "ACTIVE" },
          include: { staffAttendance: { where: { date: { in: weekDayDates } } } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const attendanceMap: Record<string, StaffAttendanceStatus> = {};
  for (const a of myWeekAttendance) {
    attendanceMap[toIso(a.date)] = a.status;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الحضور والإجازات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          تسجيل الحضور الذاتي وطلبات الإجازة
        </p>
      </div>

      {isStaff && (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">حضوري هذا الأسبوع</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {myScheduledDays
                ? "سجّلي حضورك في أيام انعقاد حلقتك، ويمكنك تعديل السجل خلال الأسبوع الحالي"
                : "سجّلي حضورك يوميًا، ويمكنك تعديل السجل خلال الأسبوع الحالي"}
            </p>
            <StaffWeeklyGrid weekDays={myWeekDays} attendance={attendanceMap} />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">طلب إجازة</h2>
            <LeaveRequestForm />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">طلباتي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-4 py-2 font-medium">من</th>
                    <th className="px-4 py-2 font-medium">إلى</th>
                    <th className="px-4 py-2 font-medium">السبب</th>
                    <th className="px-4 py-2 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {myLeaveRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                        لا توجد طلبات إجازة سابقة
                      </td>
                    </tr>
                  )}
                  {myLeaveRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                        {toIso(r.fromDate)}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                        {toIso(r.toDate)}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300 max-w-xs">{r.reason}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${LEAVE_STATUS_STYLES[r.status]}`}
                        >
                          {LEAVE_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {canExportStudents && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">تصدير حضور الطالبات</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            حدّدي مدى التاريخ لتصدير سجل حضور وغياب الطالبات، أو الغائبات فقط
          </p>
          <form
            method="get"
            className="flex flex-wrap items-end gap-4 mb-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">من تاريخ</label>
              <input
                type="date"
                name="from"
                defaultValue={exportFrom}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">إلى تاريخ</label>
              <input
                type="date"
                name="to"
                defaultValue={exportTo}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand text-white text-sm font-medium px-5 py-2 hover:bg-brand-dark transition"
            >
              تصفية
            </button>
            <a
              href={`/attendance?from=${thisWeekFrom}&to=${thisWeekTo}`}
              className="text-sm text-brand hover:underline px-2 py-2"
            >
              هذا الأسبوع
            </a>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton href={`/api/export/attendance?${exportQuery}`} label="تصدير الحضور الكامل" emphasize />
            <ExportButton
              href={`/api/export/attendance?${exportQuery}&onlyAbsent=1`}
              label="تصدير الغائبات فقط"
            />
          </div>
        </div>
      )}

      {(isAdmin || user.role === "SUPERVISOR") && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              طلبات الإجازة المعلّقة ({pendingRequests.length})
            </h2>
          </div>
          <div className="p-2">
            <LeaveRequestsTable
              requests={pendingRequests.map((r) => ({
                id: r.id,
                userName: r.user.name,
                roleLabel: ROLE_LABELS[r.user.role],
                fromDate: toIso(r.fromDate),
                toDate: toIso(r.toDate),
                reason: r.reason,
              }))}
            />
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">ملخص حضور الطاقم هذا الأسبوع</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                  <th className="px-4 py-2 font-medium">الاسم</th>
                  <th className="px-4 py-2 font-medium">الصفة</th>
                  {weekDays.map((d) => (
                    <th key={d.iso} className="px-4 py-2 font-medium">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {weeklyStaffSummary.length === 0 && (
                  <tr>
                    <td colSpan={2 + weekDays.length} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                      لا يوجد طاقم مفعّل بعد
                    </td>
                  </tr>
                )}
                {weeklyStaffSummary.map((member) => {
                  const memberMap: Record<string, StaffAttendanceStatus> = {};
                  for (const a of member.staffAttendance) memberMap[toIso(a.date)] = a.status;
                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {member.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ROLE_LABELS[member.role]}
                      </td>
                      {weekDays.map((d) => {
                        const status = memberMap[d.iso];
                        return (
                          <td key={d.iso} className="px-4 py-2">
                            {status ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STAFF_STATUS_STYLES[status]}`}
                              >
                                {STAFF_STATUS_LABELS[status]}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
