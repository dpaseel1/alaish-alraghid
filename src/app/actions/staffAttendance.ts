"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, isAdminRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { riyadhFullWeekDays } from "@/lib/timezone";
import { HALAQA_DAYS } from "@/lib/halaqaDays";
import type { StaffAttendanceStatus, Role } from "@/generated/prisma/client";

export type LeaveRequestActionState = { error?: string; success?: string };

const STAFF_ATTENDANCE_STATUSES: StaffAttendanceStatus[] = [
  "PRESENT",
  "ABSENT_EXCUSED",
  "ABSENT_UNEXCUSED",
  "LEAVE",
];

const STAFF_ATTENDANCE_LABELS: Record<StaffAttendanceStatus, string> = {
  PRESENT: "حاضرة",
  ABSENT_EXCUSED: "غياب بعذر",
  ABSENT_UNEXCUSED: "غياب بدون عذر",
  LEAVE: "إجازة",
};

/** تُنشئ/تحدّث سجل حضور المستخدمة نفسها ليوم ضمن أيام انعقاد حلقتها هذا الأسبوع (المعلمة)، أو الأحد-الخميس افتراضيًا (المشرفة، أو معلمة بلا أيام محددة) */
export async function toggleStaffAttendanceAction(dateIso: string, status: StaffAttendanceStatus) {
  const user = await requireRole("TEACHER", "SUPERVISOR");
  // الإجازة لا تُضبط ذاتيًا، بل تلقائيًا فقط عند موافقة المديرة/المشرفة على طلب إجازة
  if (status === "LEAVE" || !STAFF_ATTENDANCE_STATUSES.includes(status)) return;

  const date = new Date(dateIso);
  const fullWeek = riyadhFullWeekDays();

  let validDates: number[];
  if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({ where: { teacherId: user.id }, select: { days: true } });
    const scheduledDays = halaqa && halaqa.days.length > 0 ? new Set(halaqa.days) : null;
    validDates = (scheduledDays ? fullWeek.filter((d) => scheduledDays.has(HALAQA_DAYS[d.getUTCDay()])) : fullWeek.slice(0, 5)).map(
      (d) => d.getTime()
    );
  } else {
    validDates = fullWeek.slice(0, 5).map((d) => d.getTime());
  }

  if (!validDates.includes(date.getTime())) return; // منع التلاعب بتواريخ خارج أيام حلقتها هذا الأسبوع

  await db.staffAttendance.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, status, recordedById: user.id },
    update: { status, recordedById: user.id },
  });

  await logAudit({
    actor: user,
    action: "STAFF_ATTENDANCE_TOGGLE",
    targetType: "StaffAttendance",
    targetId: user.id,
    targetLabel: user.name,
    message: `سجّلت حضورها (${STAFF_ATTENDANCE_LABELS[status]}) ليوم ${dateIso}`,
  });

  revalidatePath("/attendance");
}

const leaveRequestSchema = z
  .object({
    fromDate: z.string().min(1, "الرجاء تحديد تاريخ البداية"),
    toDate: z.string().min(1, "الرجاء تحديد تاريخ النهاية"),
    reason: z.string().trim().min(5, "الرجاء توضيح سبب الإجازة (٥ أحرف على الأقل)"),
  })
  .refine((data) => new Date(data.toDate).getTime() >= new Date(data.fromDate).getTime(), {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساويًا له",
    path: ["toDate"],
  });

/** تقدّم المعلمة/المشرفة طلب إجازة بحالة "بانتظار الموافقة" */
export async function createLeaveRequestAction(
  _prev: LeaveRequestActionState | undefined,
  formData: FormData
): Promise<LeaveRequestActionState> {
  const user = await requireRole("TEACHER", "SUPERVISOR");

  const parsed = leaveRequestSchema.safeParse({
    fromDate: formData.get("fromDate"),
    toDate: formData.get("toDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { fromDate, toDate, reason } = parsed.data;

  await db.leaveRequest.create({
    data: {
      userId: user.id,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: "PENDING",
    },
  });

  await logAudit({
    actor: user,
    action: "LEAVE_REQUEST_CREATE",
    targetType: "LeaveRequest",
    targetLabel: user.name,
    message: `قدّمت طلب إجازة من ${fromDate} إلى ${toDate}`,
  });

  revalidatePath("/attendance");
  return { success: "تم إرسال طلب الإجازة بانتظار الموافقة" };
}

/** تتحقق أن المراجعة يملك صلاحية مراجعة طلب إجازة مقدّمة من requesterId */
async function canReviewLeaveRequest(
  reviewer: { id: string; role: Role; supervisedTrackId: string | null },
  requesterId: string,
  requesterRole: Role
): Promise<boolean> {
  if (isAdminRole(reviewer.role)) return true;
  if (reviewer.role !== "SUPERVISOR") return false;
  if (requesterRole !== "TEACHER") return false; // المشرفة لا تراجع طلبات مشرفة أخرى
  if (!reviewer.supervisedTrackId) return false;

  const halaqa = await db.halaqa.findFirst({
    where: { teacherId: requesterId, trackId: reviewer.supervisedTrackId },
  });
  return !!halaqa;
}

/** المديرة/المطورة أو المشرفة (لمعلماتها فقط) تراجع طلب إجازة بالموافقة أو الرفض */
export async function reviewLeaveRequestAction(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string
) {
  const reviewer = await requireRole("ADMIN", "SUPERVISOR");

  const request = await db.leaveRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request || request.status !== "PENDING") return;

  const allowed = await canReviewLeaveRequest(reviewer, request.userId, request.user.role);
  if (!allowed) return;

  await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      reviewedById: reviewer.id,
      reviewedByName: reviewer.name,
      reviewedAt: new Date(),
      reviewNote: note?.trim() || null,
    },
  });

  if (decision === "APPROVED") {
    const days: Date[] = [];
    const cursor = new Date(request.fromDate);
    while (cursor.getTime() <= request.toDate.getTime()) {
      days.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    await Promise.all(
      days.map((date) =>
        db.staffAttendance.upsert({
          where: { userId_date: { userId: request.userId, date } },
          create: { userId: request.userId, date, status: "LEAVE", recordedById: reviewer.id },
          update: { status: "LEAVE", recordedById: reviewer.id },
        })
      )
    );
  }

  await logAudit({
    actor: reviewer,
    action: decision === "APPROVED" ? "LEAVE_REQUEST_APPROVE" : "LEAVE_REQUEST_REJECT",
    targetType: "LeaveRequest",
    targetId: request.id,
    targetLabel: request.user.name,
    message:
      decision === "APPROVED"
        ? `وافقت على طلب إجازة "${request.user.name}"`
        : `رفضت طلب إجازة "${request.user.name}"`,
  });

  revalidatePath("/attendance");
}
