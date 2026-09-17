"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { decryptNationalId, hashPassword } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { passwordSchema } from "@/lib/validation";
import { normalizeDigits } from "@/lib/numbers";

export type TeacherActionState = { error?: string; success?: string };

export async function approveTeacherAction(userId: string) {
  const actor = await requireRole("ADMIN", "SUPERVISOR");
  const teacher = await db.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    actor,
    action: "TEACHER_APPROVE",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "وافقت على طلب تسجيل المعلمة",
  });
  revalidatePath("/teachers");
}

export async function rejectTeacherAction(userId: string) {
  const actor = await requireRole("ADMIN", "SUPERVISOR");
  const teacher = await db.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
  });
  await logAudit({
    actor,
    action: "TEACHER_REJECT",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "رفضت طلب تسجيل المعلمة",
  });
  revalidatePath("/teachers");
}

export async function unrejectTeacherAction(userId: string) {
  const actor = await requireRole("ADMIN", "SUPERVISOR");
  const teacher = await db.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    actor,
    action: "TEACHER_UNREJECT",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "ألغت رفض طلب تسجيل المعلمة ووافقت عليها",
  });
  revalidatePath("/teachers");
}

export async function suspendTeacherAction(userId: string) {
  const actor = await requireRole("ADMIN", "SUPERVISOR");
  const teacher = await db.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });
  await logAudit({
    actor,
    action: "TEACHER_SUSPEND",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "أوقفت حساب المعلمة",
  });
  revalidatePath("/teachers");
}

export async function reactivateTeacherAction(userId: string) {
  const actor = await requireRole("ADMIN", "SUPERVISOR");
  const teacher = await db.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    actor,
    action: "TEACHER_REACTIVATE",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "أعادت تفعيل حساب المعلمة",
  });
  revalidatePath("/teachers");
}

/** المديرة فقط تقدر تكشف رقم الهوية/الإقامة الكامل - يُستخدم عند الحاجة فقط (مثل التوثيق) */
export async function revealNationalIdAction(
  userId: string
): Promise<{ nationalId: string } | { error: string }> {
  await requireRole("ADMIN");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "المستخدم غير موجود" };
  try {
    return { nationalId: decryptNationalId(user.nationalIdEncrypted) };
  } catch {
    return { error: "تعذّر فك تشفير رقم الهوية/الإقامة" };
  }
}

const volunteerAdjustmentSchema = z.preprocess(
  (v) => (typeof v === "string" ? normalizeDigits(v) : v),
  z.coerce.number().int("الرجاء إدخال رقم صحيح")
);

/** تعديل يدوي (زيادة/نقصان) فوق الساعات التطوعية المحسوبة تلقائيًا لمعلمة - متاح للمشرفة على مسارها وللمديرة على الجميع */
export async function adjustTeacherVolunteerHoursAction(
  userId: string,
  _prev: TeacherActionState | undefined,
  formData: FormData
): Promise<TeacherActionState> {
  const actor = await requireRole("ADMIN", "SUPERVISOR");

  const teacher = await db.user.findUnique({
    where: { id: userId },
    include: { teacherHalaqa: { select: { trackId: true } } },
  });
  if (!teacher || teacher.role !== "TEACHER") return { error: "المعلمة غير موجودة" };

  if (actor.role === "SUPERVISOR" && teacher.teacherHalaqa?.trackId !== actor.supervisedTrackId) {
    return { error: "لا تملكين صلاحية تعديل بيانات هذه المعلمة" };
  }

  const parsed = volunteerAdjustmentSchema.safeParse(formData.get("adjustment"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.user.update({
    where: { id: userId },
    data: { volunteerHoursAdjustment: parsed.data },
  });

  await logAudit({
    actor,
    action: "TEACHER_VOLUNTEER_HOURS_ADJUST",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: `عدّلت الساعات التطوعية اليدوية للمعلمة إلى ${parsed.data}`,
  });

  revalidatePath("/teachers");
  return { success: "تم تحديث الساعات التطوعية" };
}

/** المديرة فقط تقدر تغيّر رمز مرور معلمة مباشرة (دون حاجة لكلمة المرور الحالية) */
export async function adminResetTeacherPasswordAction(
  userId: string,
  _prev: TeacherActionState | undefined,
  formData: FormData
): Promise<TeacherActionState> {
  const actor = await requireRole("ADMIN");

  const teacher = await db.user.findUnique({ where: { id: userId } });
  if (!teacher || teacher.role !== "TEACHER") return { error: "المعلمة غير موجودة" };

  const parsed = passwordSchema.safeParse(formData.get("newPassword"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "كلمة المرور غير صحيحة" };
  }

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data) },
  });

  await logAudit({
    actor,
    action: "TEACHER_PASSWORD_RESET",
    targetType: "User",
    targetId: teacher.id,
    targetLabel: teacher.name,
    message: "غيّرت رمز مرور المعلمة",
  });

  revalidatePath("/teachers");
  return { success: "تم تغيير رمز المرور بنجاح" };
}
