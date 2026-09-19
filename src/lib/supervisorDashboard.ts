import "server-only";
import { db } from "@/lib/db";
import { HALAQA_DAYS, DEFAULT_HALAQA_DAYS, HALAQA_DAY_LABELS, NARRATION_DAY, type HalaqaDay } from "@/lib/halaqaDays";
import type { TrackType, User } from "@/generated/prisma/client";

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** بداية أسبوع (الأحد) لتاريخ عشوائي بتوقيت UTC-منتصف-ليل، مثل riyadhWeekStart لكن لأي تاريخ وليس اليوم فقط */
function weekStartOf(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** كل التواريخ ضمن [from,to] (شاملة) التي توافق أيام انعقاد الحلقة، أو الأحد-الخميس افتراضيًا */
function enumerateMeetingDates(days: string[], from: Date, to: Date): Date[] {
  const scheduledDays = new Set<HalaqaDay>((days.length > 0 ? days : DEFAULT_HALAQA_DAYS) as HalaqaDay[]);
  const dates: Date[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const code = HALAQA_DAYS[cursor.getUTCDay()];
    if (scheduledDays.has(code)) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export type DayCellStatus = "PRESENT" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED" | "NO_DATA";

export type DayCell = {
  dateIso: string;
  status: DayCellStatus;
  pagesMemorized: number | null;
  pagesReviewed: number | null;
  isNarrationDay: boolean;
  sardPages: number | null;
};

export type StudentRow = {
  id: string;
  name: string;
  attendance: { present: number; excused: number; unexcused: number; rate: number };
  cells: DayCell[];
  totals: { memorized: number; dailyReviewed: number; sard: number; reviewTotal: number };
};

export type HalaqaReport = {
  id: string;
  name: string;
  trackName: string | null;
  trackType: TrackType | null;
  teacherName: string | null;
  daysLabel: string;
  narrationDayLabel: string;
  teacherAttendance: { present: number; excused: number; unexcused: number; leave: number; rate: number };
  meetingDates: string[];
  students: StudentRow[];
  halaqaTotals: { studentsCount: number; memorized: number; dailyReviewed: number; sard: number; reviewTotal: number };
};

export type SupervisorDashboardData = {
  from: string;
  to: string;
  summary: {
    totalStudents: number;
    totalTeachers: number;
    totalMemorized: number;
    totalReview: number;
    totalSardIndependent: number;
  };
  halaqat: HalaqaReport[];
};

export async function buildSupervisorDashboard({
  user,
  halaqaId,
  trackId,
  from,
  to,
}: {
  user: User;
  halaqaId?: string | null;
  trackId?: string | null;
  from: Date;
  to: Date;
}): Promise<SupervisorDashboardData> {
  const trackScopeWhere = user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId ?? "__no_track__" } : trackId ? { trackId } : {};

  const halaqat = await db.halaqa.findMany({
    where: halaqaId ? { id: halaqaId, ...trackScopeWhere } : { isActive: true, ...trackScopeWhere },
    select: {
      id: true,
      name: true,
      days: true,
      teacherId: true,
      teacher: { select: { id: true, name: true } },
      track: { select: { name: true, type: true } },
      students: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const studentIds = halaqat.flatMap((h) => h.students.map((s) => s.id));
  const teacherIds = [...new Set(halaqat.map((h) => h.teacherId).filter((id): id is string => !!id))];

  // نحسب مسبقًا التواريخ الفعلية لكل حلقة، وأسابيع يوم السرد المطلوبة، لتفادي أي استعلام داخل الحلقة (N+1)
  const meetingDatesByHalaqa = new Map<string, Date[]>();
  const narrationWeekStarts = new Set<string>();
  for (const h of halaqat) {
    const dates = enumerateMeetingDates(h.days, from, to);
    meetingDatesByHalaqa.set(h.id, dates);
    for (const d of dates) {
      if (HALAQA_DAYS[d.getUTCDay()] === NARRATION_DAY) {
        narrationWeekStarts.add(weekStartOf(d).toISOString());
      }
    }
  }

  const [memoRecords, attendanceRecords, weeklyRecitations, staffAttendance] = await Promise.all([
    studentIds.length > 0
      ? db.memorizationRecord.findMany({
          where: { studentId: { in: studentIds }, date: { gte: from, lte: to } },
          select: { studentId: true, date: true, pagesMemorized: true, pagesReviewed: true },
        })
      : Promise.resolve([]),
    studentIds.length > 0
      ? db.studentAttendance.findMany({
          where: { studentId: { in: studentIds }, attendanceLog: { date: { gte: from, lte: to } } },
          select: { studentId: true, status: true, attendanceLog: { select: { date: true } } },
        })
      : Promise.resolve([]),
    studentIds.length > 0 && narrationWeekStarts.size > 0
      ? db.weeklyRecitation.findMany({
          where: { studentId: { in: studentIds }, weekStart: { in: [...narrationWeekStarts].map((iso) => new Date(iso)) } },
          select: { studentId: true, weekStart: true, recited: true, pagesRecorded: true },
        })
      : Promise.resolve([]),
    teacherIds.length > 0
      ? db.staffAttendance.findMany({
          where: { userId: { in: teacherIds }, date: { gte: from, lte: to } },
          select: { userId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const memoByKey = new Map<string, { pagesMemorized: number; pagesReviewed: number }>();
  for (const r of memoRecords) {
    memoByKey.set(`${r.studentId}_${toIso(r.date)}`, { pagesMemorized: r.pagesMemorized, pagesReviewed: r.pagesReviewed });
  }
  const attendanceByKey = new Map<string, DayCellStatus>();
  for (const a of attendanceRecords) {
    attendanceByKey.set(`${a.studentId}_${toIso(a.attendanceLog.date)}`, a.status);
  }
  const weeklyRecByKey = new Map<string, { recited: boolean; pagesRecorded: number }>();
  for (const w of weeklyRecitations) {
    weeklyRecByKey.set(`${w.studentId}_${w.weekStart.toISOString()}`, { recited: w.recited, pagesRecorded: w.pagesRecorded });
  }

  let summaryStudents = 0;
  let summaryMemorized = 0;
  let summaryReview = 0;
  let summarySard = 0;
  const summaryTeacherIds = new Set<string>();

  const halaqaReports: HalaqaReport[] = halaqat.map((h) => {
    const meetingDates = meetingDatesByHalaqa.get(h.id) ?? [];
    const scheduledLabels = (h.days.length > 0 ? h.days : DEFAULT_HALAQA_DAYS)
      .map((d) => HALAQA_DAY_LABELS[d as HalaqaDay])
      .join("، ");

    const teacherStaffAttendance = h.teacherId ? staffAttendance.filter((s) => s.userId === h.teacherId) : [];
    const tPresent = teacherStaffAttendance.filter((s) => s.status === "PRESENT").length;
    const tExcused = teacherStaffAttendance.filter((s) => s.status === "ABSENT_EXCUSED").length;
    const tUnexcused = teacherStaffAttendance.filter((s) => s.status === "ABSENT_UNEXCUSED").length;
    const tLeave = teacherStaffAttendance.filter((s) => s.status === "LEAVE").length;
    const tTotal = teacherStaffAttendance.length;

    let halaqaMemorized = 0;
    let halaqaDailyReviewed = 0;
    let halaqaSard = 0;

    const students: StudentRow[] = h.students.map((s) => {
      let present = 0;
      let excused = 0;
      let unexcused = 0;
      let memorized = 0;
      let dailyReviewed = 0;
      let sard = 0;

      const cells: DayCell[] = meetingDates.map((date) => {
        const dateIso = toIso(date);
        const key = `${s.id}_${dateIso}`;
        const status = attendanceByKey.get(key) ?? "NO_DATA";
        if (status === "PRESENT") present++;
        else if (status === "ABSENT_EXCUSED") excused++;
        else if (status === "ABSENT_UNEXCUSED") unexcused++;

        const memo = memoByKey.get(key);
        const pagesMemorized = memo?.pagesMemorized ?? null;
        const pagesReviewed = memo?.pagesReviewed ?? null;
        memorized += pagesMemorized ?? 0;
        dailyReviewed += pagesReviewed ?? 0;

        const isNarrationDay = HALAQA_DAYS[date.getUTCDay()] === NARRATION_DAY;
        let sardPages: number | null = null;
        if (isNarrationDay) {
          const rec = weeklyRecByKey.get(`${s.id}_${weekStartOf(date).toISOString()}`);
          sardPages = rec?.recited ? rec.pagesRecorded : 0;
          sard += sardPages;
        }

        return { dateIso, status, pagesMemorized, pagesReviewed, isNarrationDay, sardPages };
      });

      const attendanceTotal = present + excused + unexcused;
      halaqaMemorized += memorized;
      halaqaDailyReviewed += dailyReviewed;
      halaqaSard += sard;

      return {
        id: s.id,
        name: s.name,
        attendance: {
          present,
          excused,
          unexcused,
          rate: attendanceTotal ? Math.round((present / attendanceTotal) * 1000) / 10 : 0,
        },
        cells,
        totals: { memorized, dailyReviewed, sard, reviewTotal: dailyReviewed + sard },
      };
    });

    summaryStudents += students.length;
    summaryMemorized += halaqaMemorized;
    summaryReview += halaqaDailyReviewed + halaqaSard;
    summarySard += halaqaSard;
    if (h.teacherId) summaryTeacherIds.add(h.teacherId);

    return {
      id: h.id,
      name: h.name,
      trackName: h.track?.name ?? null,
      trackType: h.track?.type ?? null,
      teacherName: h.teacher?.name ?? null,
      daysLabel: scheduledLabels,
      narrationDayLabel: HALAQA_DAY_LABELS[NARRATION_DAY],
      teacherAttendance: {
        present: tPresent,
        excused: tExcused,
        unexcused: tUnexcused,
        leave: tLeave,
        rate: tTotal ? Math.round((tPresent / tTotal) * 1000) / 10 : 0,
      },
      meetingDates: meetingDates.map(toIso),
      students,
      halaqaTotals: {
        studentsCount: students.length,
        memorized: halaqaMemorized,
        dailyReviewed: halaqaDailyReviewed,
        sard: halaqaSard,
        reviewTotal: halaqaDailyReviewed + halaqaSard,
      },
    };
  });

  return {
    from: toIso(from),
    to: toIso(to),
    summary: {
      totalStudents: summaryStudents,
      totalTeachers: summaryTeacherIds.size,
      totalMemorized: summaryMemorized,
      totalReview: summaryReview,
      totalSardIndependent: summarySard,
    },
    halaqat: halaqaReports,
  };
}
