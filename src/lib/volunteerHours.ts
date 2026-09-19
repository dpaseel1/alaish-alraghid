import { db } from "@/lib/db";

/**
 * تحسب عدد أيام الحضور المحسوبة تلقائيًا للمعلمة: يوم واحد لكل يوم حضرت فيه المعلمة شخصيًا
 * وسجّلت بيانات حلقتها لنفس اليوم (بدون احتساب التعديل اليدوي)
 */
export async function computeAttendanceDays(teacherId: string, halaqaId: string): Promise<number> {
  const [submittedLogs, presentAttendance] = await Promise.all([
    db.attendanceLog.findMany({
      where: { halaqaId, dataSubmitted: true },
      select: { date: true },
    }),
    db.staffAttendance.findMany({
      where: { userId: teacherId, status: "PRESENT" },
      select: { date: true },
    }),
  ]);

  const presentDates = new Set(presentAttendance.map((a) => a.date.getTime()));
  return submittedLogs.filter((l) => presentDates.has(l.date.getTime())).length;
}

/**
 * تحسب الساعات التطوعية للمعلمة: ساعة واحدة لكل يوم حضرت فيه المعلمة شخصيًا وسجّلت بيانات حلقتها لنفس اليوم،
 * مضافًا إليها التعديل اليدوي (زيادة/نقصان) الذي قد تضبطه المشرفة/المديرة فوق هذا المحسوب تلقائيًا
 */
export async function computeVolunteerHours(
  teacherId: string,
  halaqaId: string,
  adjustment: number
): Promise<number> {
  const attendanceDays = await computeAttendanceDays(teacherId, halaqaId);
  return attendanceDays * 1 + adjustment;
}

/**
 * نسخة مُجمَّعة (batched) من computeAttendanceDays لعدة معلمات دفعة واحدة، لتفادي مشكلة N+1
 * في صفحات القوائم (مثل /teachers). تُعيد Map من userId إلى عدد أيام الحضور المحسوبة تلقائيًا
 */
export async function computeAttendanceDaysForTeachers(
  teachers: { id: string; teacherHalaqa: { id: string } | null }[]
): Promise<Map<string, number>> {
  const halaqaIds = teachers.map((t) => t.teacherHalaqa?.id).filter((id): id is string => !!id);
  const teacherIds = teachers.map((t) => t.id);

  const [allLogs, allAttendance] = await Promise.all([
    db.attendanceLog.findMany({
      where: { halaqaId: { in: halaqaIds }, dataSubmitted: true },
      select: { halaqaId: true, date: true },
    }),
    db.staffAttendance.findMany({
      where: { userId: { in: teacherIds }, status: "PRESENT" },
      select: { userId: true, date: true },
    }),
  ]);

  const submittedDatesByHalaqa = new Map<string, Set<number>>();
  for (const log of allLogs) {
    const set = submittedDatesByHalaqa.get(log.halaqaId) ?? new Set<number>();
    set.add(log.date.getTime());
    submittedDatesByHalaqa.set(log.halaqaId, set);
  }

  const presentDatesByUser = new Map<string, Set<number>>();
  for (const a of allAttendance) {
    const set = presentDatesByUser.get(a.userId) ?? new Set<number>();
    set.add(a.date.getTime());
    presentDatesByUser.set(a.userId, set);
  }

  const attendanceDaysByTeacher = new Map<string, number>();
  for (const t of teachers) {
    const submittedDates = t.teacherHalaqa ? submittedDatesByHalaqa.get(t.teacherHalaqa.id) : null;
    const presentDates = presentDatesByUser.get(t.id);
    const attendanceDays =
      submittedDates && presentDates ? [...submittedDates].filter((d) => presentDates.has(d)).length : 0;
    attendanceDaysByTeacher.set(t.id, attendanceDays);
  }

  return attendanceDaysByTeacher;
}
