import { db } from "@/lib/db";

/**
 * تحسب الساعات التطوعية للمعلمة: ساعة واحدة لكل يوم حضرت فيه المعلمة شخصيًا وسجّلت بيانات حلقتها لنفس اليوم،
 * مضافًا إليها التعديل اليدوي (زيادة/نقصان) الذي قد تضبطه المشرفة/المديرة فوق هذا المحسوب تلقائيًا
 */
export async function computeVolunteerHours(
  teacherId: string,
  halaqaId: string,
  adjustment: number
): Promise<number> {
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
  const attendanceDays = submittedLogs.filter((l) => presentDates.has(l.date.getTime())).length;

  return attendanceDays * 1 + adjustment;
}
