"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser, isAdminRole } from "@/lib/session";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type StudentActionState = { error?: string; success?: string };

const studentSchema = z.object({
  name: z.string().trim().min(2, "اسم الطالبة قصير جدًا"),
  nationality: z.string().trim().min(2, "الرجاء تحديد الجنسية"),
  halaqaId: z.string().min(1, "الرجاء اختيار الحلقة"),
  currentQuota: z.string().trim().optional().or(z.literal("")),
});

async function assertHalaqaAccess(halaqaId: string) {
  const user = await requireUser();
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return { user, ok: false as const };

  if (isAdminRole(user.role)) return { user, ok: true as const, halaqa };
  if (user.role === "SUPERVISOR")
    return { user, ok: halaqa.supervisorId === user.id, halaqa };
  if (user.role === "TEACHER")
    return { user, ok: halaqa.teacherId === user.id, halaqa };
  return { user, ok: false as const, halaqa };
}

export async function createStudentAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    nationality: formData.get("nationality"),
    halaqaId: formData.get("halaqaId"),
    currentQuota: formData.get("currentQuota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { ok, user } = await assertHalaqaAccess(parsed.data.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية الإضافة لهذه الحلقة" };

  const student = await db.student.create({
    data: {
      name: parsed.data.name,
      nationality: parsed.data.nationality,
      halaqaId: parsed.data.halaqaId,
      currentQuota: parsed.data.currentQuota || null,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_CREATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: "أضافت طالبة جديدة",
  });

  revalidatePath("/students");
  revalidatePath("/");
  return { success: "تمت إضافة الطالبة بنجاح" };
}

export async function updateStudentAction(
  studentId: string,
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "الطالبة غير موجودة" };

  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية تعديل بيانات هذه الطالبة" };

  const parsed = studentSchema
    .omit({ halaqaId: true })
    .safeParse({
      name: formData.get("name"),
      nationality: formData.get("nationality"),
      currentQuota: formData.get("currentQuota"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.student.update({
    where: { id: studentId },
    data: {
      name: parsed.data.name,
      nationality: parsed.data.nationality,
      currentQuota: parsed.data.currentQuota || null,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_UPDATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: parsed.data.name,
    message: "عدّلت بيانات الطالبة",
  });

  revalidatePath("/students");
  return { success: "تم تحديث بيانات الطالبة" };
}

export async function deleteStudentAction(studentId: string) {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;
  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return;

  await db.student.update({ where: { id: studentId }, data: { isActive: false } });

  await logAudit({
    actor: user,
    action: "STUDENT_DELETE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: "حذفت الطالبة",
  });

  revalidatePath("/students");
  revalidatePath("/");
}

/** تسجيل بيانات اليوم: الحضور + الأوجه المحفوظة لكل طالبات الحلقة دفعة واحدة */
export async function submitDailyDataAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  const user = await requireRole("TEACHER");

  const halaqa = await db.halaqa.findUnique({
    where: { teacherId: user.id },
    include: { students: { where: { isActive: true } } },
  });
  if (!halaqa) return { error: "لا توجد حلقة مرتبطة بحسابك" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceLog = await db.attendanceLog.upsert({
    where: { halaqaId_date: { halaqaId: halaqa.id, date: today } },
    create: {
      halaqaId: halaqa.id,
      date: today,
      teacherPresent: true,
      dataSubmitted: true,
      submittedAt: new Date(),
    },
    update: { dataSubmitted: true, submittedAt: new Date() },
  });

  for (const student of halaqa.students) {
    const present = formData.get(`present_${student.id}`) === "on";
    const pagesRaw = formData.get(`pages_${student.id}`);
    const quotaRaw = formData.get(`quota_${student.id}`);
    const pages = pagesRaw ? parseInt(String(pagesRaw), 10) : 0;
    const quota = quotaRaw ? String(quotaRaw).trim() : "";

    await db.studentAttendance.upsert({
      where: {
        attendanceLogId_studentId: {
          attendanceLogId: attendanceLog.id,
          studentId: student.id,
        },
      },
      create: {
        attendanceLogId: attendanceLog.id,
        studentId: student.id,
        present,
      },
      update: { present },
    });

    if (pages > 0) {
      await db.memorizationRecord.create({
        data: {
          studentId: student.id,
          date: today,
          pagesMemorized: pages,
          quota: quota || null,
          enteredById: user.id,
        },
      });

      await db.student.update({
        where: { id: student.id },
        data: {
          memorizedPagesTotal: { increment: pages },
          ...(quota ? { currentQuota: quota } : {}),
        },
      });
    }
  }

  await logAudit({
    actor: user,
    action: "DAILY_DATA_SUBMIT",
    targetType: "Halaqa",
    targetId: halaqa.id,
    targetLabel: halaqa.name,
    message: `سجّلت بيانات الحضور والحفظ اليومية (${halaqa.students.length} طالبة)`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: "تم حفظ بيانات اليوم بنجاح" };
}

const examGradeSchema = z.object({
  studentId: z.string().min(1),
  quota: z.string().trim().min(1, "الرجاء تحديد النصاب"),
  grade: z.coerce.number().min(0),
  maxGrade: z.coerce.number().min(1).default(100),
  examDate: z.string().min(1, "الرجاء تحديد تاريخ الاختبار"),
});

export async function addExamGradeAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  const user = await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const parsed = examGradeSchema.safeParse({
    studentId: formData.get("studentId"),
    quota: formData.get("quota"),
    grade: formData.get("grade"),
    maxGrade: formData.get("maxGrade") || 100,
    examDate: formData.get("examDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const student = await db.student.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student) return { error: "الطالبة غير موجودة" };
  const { ok } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية إضافة درجة لهذه الطالبة" };

  await db.examGrade.create({
    data: {
      studentId: parsed.data.studentId,
      quota: parsed.data.quota,
      grade: parsed.data.grade,
      maxGrade: parsed.data.maxGrade,
      examDate: new Date(parsed.data.examDate),
      enteredById: user.id,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_GRADE_ADD",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: `سجّلت درجة اختبار (${parsed.data.quota}: ${parsed.data.grade}/${parsed.data.maxGrade}) للطالبة`,
  });

  revalidatePath("/students");
  revalidatePath("/reports");
  return { success: "تم تسجيل الدرجة بنجاح" };
}
