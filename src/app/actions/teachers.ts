"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { decryptNationalId } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

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
