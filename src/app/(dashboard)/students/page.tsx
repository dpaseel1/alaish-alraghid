import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { riyadhToday, riyadhFullWeekDays, riyadhWeekStart } from "@/lib/timezone";
import { HALAQA_DAYS, HALAQA_DAY_LABELS, type HalaqaDay } from "@/lib/halaqaDays";
import { updateStudentAction, deleteStudentAction, reactivateStudentAction } from "@/app/actions/students";
import { AddStudentForm } from "@/components/students/AddStudentForm";
import { ImportStudentsForm } from "@/components/students/ImportStudentsForm";
import { StudentRow } from "@/components/students/StudentRow";
import { DailyDataForm } from "@/components/students/DailyDataForm";
import { ImportAttendanceForm } from "@/components/students/ImportAttendanceForm";
import { ExamGradesCard } from "@/components/students/ExamGradesCard";
import { HalaqaSelect } from "@/components/students/HalaqaSelect";
import { ExportButton } from "@/components/export/ExportButton";
import type { StudentAttendanceStatus } from "@/generated/prisma/client";

/** يحصر weekOffset القادم من رابط الصفحة لعدد صحيح آمن (لا يتجاوز الأسبوع الحالي، وبحد أقصى 5 سنوات للخلف) */
function parseWeekOffsetParam(raw: string | undefined): number {
  const n = Math.trunc(Number(raw ?? 0));
  if (!Number.isFinite(n)) return 0;
  return Math.min(0, Math.max(-260, n));
}

/** يجلب بيانات أسبوع كاملة (لا اليوم فقط) لحلقة معيّنة: الحضور، الأوجه/النصاب/المراجعة لكل يوم انعقاد، والسرد الأسبوعي.
 *  weekOffset بالأسابيع نسبةً للأسبوع الحالي (0 = الحالي، -1 = الأسبوع الماضي، ...) لتدارك أسبوع فات */
async function buildWeekWorkspace(
  halaqa: { id: string; days: string[]; students: { id: string }[] },
  weekOffset = 0
) {
  const today = riyadhToday();
  const scheduledDays = halaqa.days.length > 0 ? new Set(halaqa.days) : null;
  const fullWeek = riyadhFullWeekDays(weekOffset);
  const weekDayDates = (
    scheduledDays ? fullWeek.filter((d) => scheduledDays.has(HALAQA_DAYS[d.getUTCDay()])) : fullWeek.slice(0, 5)
  ).filter((d) => weekOffset < 0 || d.getTime() <= today.getTime());
  const weekDays = weekDayDates.map((d) => ({
    iso: d.toISOString().slice(0, 10),
    label: HALAQA_DAY_LABELS[HALAQA_DAYS[d.getUTCDay()] as HalaqaDay],
  }));
  const studentIds = halaqa.students.map((s) => s.id);

  const weekLogs = await db.attendanceLog.findMany({
    where: { halaqaId: halaqa.id, date: { in: weekDayDates } },
    include: { studentAttendance: true },
  });

  const weekAttendance: Record<string, Record<string, { status: StudentAttendanceStatus; reason: string | null }>> =
    {};
  for (const log of weekLogs) {
    const dateIso = log.date.toISOString().slice(0, 10);
    for (const a of log.studentAttendance) {
      weekAttendance[a.studentId] = weekAttendance[a.studentId] ?? {};
      weekAttendance[a.studentId][dateIso] = { status: a.status, reason: a.reason };
    }
  }

  const todayIso = today.toISOString().slice(0, 10);
  const todayLog = weekLogs.find((log) => log.date.toISOString().slice(0, 10) === todayIso);

  const weekMemorization = await db.memorizationRecord.findMany({
    where: { date: { in: weekDayDates }, studentId: { in: studentIds } },
    select: { studentId: true, date: true, pagesMemorized: true, pagesReviewed: true, quota: true },
  });
  const weekPages: Record<string, Record<string, number>> = {};
  const weekQuota: Record<string, Record<string, string>> = {};
  const weekPagesReviewed: Record<string, Record<string, number>> = {};
  for (const r of weekMemorization) {
    const dateIso = r.date.toISOString().slice(0, 10);
    (weekPages[r.studentId] ??= {})[dateIso] = r.pagesMemorized;
    if (r.quota) (weekQuota[r.studentId] ??= {})[dateIso] = r.quota;
    (weekPagesReviewed[r.studentId] ??= {})[dateIso] = r.pagesReviewed;
  }

  const weekRecitationRows = await db.weeklyRecitation.findMany({
    where: { weekStart: riyadhWeekStart(weekOffset), studentId: { in: studentIds } },
    select: { studentId: true, recited: true },
  });
  const weekRecitation: Record<string, boolean> = {};
  for (const r of weekRecitationRows) weekRecitation[r.studentId] = r.recited;

  // لأسبوع سابق (weekOffset غير صفر) لا يوجد مفهوم "اليوم" ضمنه، فيُعتمد "هل أُرسلت بيانات أي يوم منه؟" كمؤشر بديل
  const alreadySubmitted =
    weekOffset === 0 ? (todayLog?.dataSubmitted ?? false) : weekLogs.some((log) => log.dataSubmitted);

  return {
    weekDays,
    todayIso,
    weekAttendance,
    weekRecitation,
    weekPages,
    weekQuota,
    weekPagesReviewed,
    alreadySubmitted,
  };
}

function WeekNavigator({
  weekOffset,
  weekDays,
  basePath,
  extraParams,
}: {
  weekOffset: number;
  weekDays: { iso: string; label: string }[];
  basePath: string;
  extraParams: Record<string, string | undefined>;
}) {
  const buildHref = (offset: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    if (offset !== 0) params.set("week", String(offset));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const rangeLabel =
    weekDays.length > 0
      ? `${weekDays[0].iso} إلى ${weekDays[weekDays.length - 1].iso}`
      : null;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
      <Link
        href={buildHref(weekOffset - 1)}
        className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        الأسبوع السابق
      </Link>
      <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
        {weekOffset === 0 ? "الأسبوع الحالي" : `أسبوع سابق (${rangeLabel ?? ""})`}
      </div>
      {weekOffset < 0 ? (
        <Link
          href={buildHref(weekOffset + 1)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          الأسبوع التالي
        </Link>
      ) : (
        <span className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-transparent select-none">
          الأسبوع التالي
        </span>
      )}
    </div>
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ halaqaId?: string; archived?: string; week?: string }>;
}) {
  const user = await requireUser();
  const { halaqaId, archived, week } = await searchParams;
  const isArchiveView = archived === "1";
  const weekOffset = parseWeekOffsetParam(week);

  const ArchiveTabs = (
    <div className="flex items-center gap-2 print:hidden">
      <Link
        href={halaqaId ? `/students?archived=0&halaqaId=${halaqaId}` : "/students?archived=0"}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          !isArchiveView
            ? "bg-brand text-white"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        نشطات
      </Link>
      <Link
        href={halaqaId ? `/students?archived=1&halaqaId=${halaqaId}` : "/students?archived=1"}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          isArchiveView
            ? "bg-brand text-white"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        مؤرشفات
      </Link>
    </div>
  );

  if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({
      where: { teacherId: user.id },
      include: {
        students: {
          where: { isActive: !isArchiveView },
          orderBy: { name: "asc" },
          include: { examGrades: { orderBy: { examDate: "desc" }, take: 1 } },
        },
      },
    });

    if (!halaqa) {
      return (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-700 dark:text-amber-400">
          لا توجد حلقة مرتبطة بحسابك بعد. تواصلي مع المشرفة أو المديرة.
        </div>
      );
    }

    // إن حدّدت المديرة أيام انعقاد للحلقة (وقد تشمل الجمعة/السبت)، تُقتصر شبكة التحضير على تلك الأيام تحديدًا.
    // إن لم تُحدَّد أيام، يُستخدم الأسبوع الدراسي الافتراضي (الأحد-الخميس) كما كان سابقًا
    const scheduledDays = halaqa.days.length > 0 ? new Set(halaqa.days) : null;
    const workspace = !isArchiveView ? await buildWeekWorkspace(halaqa, weekOffset) : null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">طالبات {halaqa.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            سجّلي حضور وأوجه الحفظ اليومية لطالباتك
          </p>
        </div>

        {!isArchiveView && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                  {weekOffset === 0 ? "بيانات اليوم" : "بيانات أسبوع سابق"}
                </h2>
                {scheduledDays && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    أيام انعقاد الحلقة: {halaqa.days.map((d) => HALAQA_DAY_LABELS[d as HalaqaDay]).join("، ")}
                  </p>
                )}
              </div>
              {workspace && (
                <WeekNavigator
                  weekOffset={weekOffset}
                  weekDays={workspace.weekDays}
                  basePath="/students"
                  extraParams={{ archived }}
                />
              )}
              {workspace && (
                <DailyDataForm
                  students={halaqa.students}
                  weekDays={workspace.weekDays}
                  todayIso={workspace.todayIso}
                  weekAttendance={workspace.weekAttendance}
                  weekRecitation={workspace.weekRecitation}
                  recitationEnabled={halaqa.recitationEnabled}
                  uniformQuota={halaqa.uniformQuota}
                  alreadySubmitted={workspace.alreadySubmitted}
                  weekPages={workspace.weekPages}
                  weekQuota={workspace.weekQuota}
                  weekPagesReviewed={workspace.weekPagesReviewed}
                  weekOffset={weekOffset}
                />
              )}
            </div>

            <ImportAttendanceForm scheduledDays={halaqa.days} students={halaqa.students} />

            <ExamGradesCard
              students={halaqa.students.map((s) => ({
                id: s.id,
                name: s.name,
                latestGrade: s.examGrades[0]
                  ? {
                      quota: s.examGrades[0].quota,
                      grade: s.examGrades[0].grade,
                      maxGrade: s.examGrades[0].maxGrade,
                    }
                  : null,
              }))}
            />
          </>
        )}

        {ArchiveTabs}

        {!isArchiveView && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إضافة طالبة جديدة</h2>
              <AddStudentForm halaqaId={halaqa.id} />
            </div>
            <ImportStudentsForm halaqaId={halaqa.id} />
          </>
        )}

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {isArchiveView ? "الطالبات المؤرشفات" : "كل الطالبات"} ({halaqa.students.length})
            </h2>
            <ExportButton href={`/api/export/students?halaqaId=${halaqa.id}`} label="تصدير Excel" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                  <th className="px-5 py-3 font-medium">الاسم</th>
                  <th className="px-5 py-3 font-medium">الجنسية</th>
                  <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                  {halaqa.recitationEnabled && (
                    <th className="px-5 py-3 font-medium">عدد أوجه المراجعة</th>
                  )}
                  <th className="px-5 py-3 font-medium">النصاب الحالي</th>
                  <th className="px-5 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {halaqa.students.length === 0 && (
                  <tr>
                    <td colSpan={halaqa.recitationEnabled ? 6 : 5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      {isArchiveView ? "لا توجد طالبات مؤرشفات" : "لا توجد طالبات مضافات بعد"}
                    </td>
                  </tr>
                )}
                {halaqa.students.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    canManage
                    canRevealNationalId={false}
                    showReviewedPages={halaqa.recitationEnabled}
                    updateAction={updateStudentAction.bind(null, s.id)}
                    deleteAction={deleteStudentAction.bind(null, s.id)}
                    isArchived={isArchiveView}
                    reactivateAction={reactivateStudentAction.bind(null, s.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN / SUPERVISOR
  const halaqat = await db.halaqa.findMany({
    where: {
      isActive: true,
      ...(user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId ?? "__no_track__" } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const selectedHalaqa = halaqaId
    ? await db.halaqa.findFirst({
        where: {
          id: halaqaId,
          ...(user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId ?? "__no_track__" } : {}),
        },
        include: {
          students: {
            where: { isActive: !isArchiveView },
            orderBy: { name: "asc" },
            include: { examGrades: { orderBy: { examDate: "desc" }, take: 1 } },
          },
        },
      })
    : null;

  // المشرفة فقط تدخل بيانات اليوم مباشرة (للحلقات التي لا معلمة لها)، بنفس منطق أيام الانعقاد المستخدم لدى المعلمة
  let supervisorWorkspace: Awaited<ReturnType<typeof buildWeekWorkspace>> | null = null;

  if (user.role === "SUPERVISOR" && selectedHalaqa && !isArchiveView) {
    supervisorWorkspace = await buildWeekWorkspace(selectedHalaqa, weekOffset);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الطالبات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            اختاري حلقة لعرض وإدارة طالباتها
          </p>
        </div>
        <HalaqaSelect halaqat={halaqat} selectedId={halaqaId} />
      </div>

      {ArchiveTabs}

      {!selectedHalaqa && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
          اختاري حلقة من القائمة أعلاه لعرض طالباتها
        </div>
      )}

      {selectedHalaqa && (
        <>
          {supervisorWorkspace && (
            <>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                    {weekOffset === 0 ? "بيانات اليوم" : "بيانات أسبوع سابق"}
                  </h2>
                  {selectedHalaqa.days.length > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      أيام انعقاد الحلقة:{" "}
                      {selectedHalaqa.days.map((d) => HALAQA_DAY_LABELS[d as HalaqaDay]).join("، ")}
                    </p>
                  )}
                </div>
                <WeekNavigator
                  weekOffset={weekOffset}
                  weekDays={supervisorWorkspace.weekDays}
                  basePath="/students"
                  extraParams={{ archived, halaqaId }}
                />
                <DailyDataForm
                  halaqaId={selectedHalaqa.id}
                  students={selectedHalaqa.students}
                  weekDays={supervisorWorkspace.weekDays}
                  todayIso={supervisorWorkspace.todayIso}
                  weekAttendance={supervisorWorkspace.weekAttendance}
                  weekRecitation={supervisorWorkspace.weekRecitation}
                  recitationEnabled={selectedHalaqa.recitationEnabled}
                  uniformQuota={selectedHalaqa.uniformQuota}
                  alreadySubmitted={supervisorWorkspace.alreadySubmitted}
                  weekPages={supervisorWorkspace.weekPages}
                  weekQuota={supervisorWorkspace.weekQuota}
                  weekPagesReviewed={supervisorWorkspace.weekPagesReviewed}
                  weekOffset={weekOffset}
                />
              </div>

              <ImportAttendanceForm
                halaqaId={selectedHalaqa.id}
                scheduledDays={selectedHalaqa.days}
                students={selectedHalaqa.students}
              />

              <ExamGradesCard
                students={selectedHalaqa.students.map((s) => ({
                  id: s.id,
                  name: s.name,
                  latestGrade: s.examGrades[0]
                    ? {
                        quota: s.examGrades[0].quota,
                        grade: s.examGrades[0].grade,
                        maxGrade: s.examGrades[0].maxGrade,
                      }
                    : null,
                }))}
              />
            </>
          )}

          {!isArchiveView && (
            <>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  إضافة طالبة إلى {selectedHalaqa.name}
                </h2>
                <AddStudentForm halaqaId={selectedHalaqa.id} />
              </div>
              <ImportStudentsForm halaqaId={selectedHalaqa.id} />
            </>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                {isArchiveView ? "طالبات مؤرشفات من" : "طالبات"} {selectedHalaqa.name} ({selectedHalaqa.students.length})
              </h2>
              <ExportButton href={`/api/export/students?halaqaId=${selectedHalaqa.id}`} label="تصدير Excel" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                    <th className="px-5 py-3 font-medium">الاسم</th>
                    <th className="px-5 py-3 font-medium">الجنسية</th>
                    <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                    {selectedHalaqa.recitationEnabled && (
                      <th className="px-5 py-3 font-medium">عدد أوجه المراجعة</th>
                    )}
                    <th className="px-5 py-3 font-medium">النصاب الحالي</th>
                    <th className="px-5 py-3 font-medium">رقم الهوية/الإقامة</th>
                    <th className="px-5 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {selectedHalaqa.students.length === 0 && (
                    <tr>
                      <td colSpan={selectedHalaqa.recitationEnabled ? 7 : 6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                        {isArchiveView ? "لا توجد طالبات مؤرشفات" : "لا توجد طالبات مضافات بعد"}
                      </td>
                    </tr>
                  )}
                  {selectedHalaqa.students.map((s) => (
                    <StudentRow
                      key={s.id}
                      student={s}
                      canManage
                      canRevealNationalId
                      canMoveAndDelete
                      halaqatOptions={halaqat}
                      showReviewedPages={selectedHalaqa.recitationEnabled}
                      updateAction={updateStudentAction.bind(null, s.id)}
                      deleteAction={deleteStudentAction.bind(null, s.id)}
                      isArchived={isArchiveView}
                      reactivateAction={reactivateStudentAction.bind(null, s.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
