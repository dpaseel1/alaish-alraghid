"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { HALAQA_CATEGORIES } from "@/lib/halaqaCategory";
import type { HalaqaCategory } from "@/generated/prisma/client";

const halaqaSchema = z.object({
  name: z.string().trim().min(2, "اسم الحلقة قصير جدًا"),
  time: z.string().trim().min(1, "الرجاء تحديد وقت الحلقة"),
  category: z.enum(HALAQA_CATEGORIES as [HalaqaCategory, ...HalaqaCategory[]], {
    message: "الرجاء اختيار تصنيف الحلقة",
  }),
  teacherId: z.string().optional().nullable(),
  supervisorId: z.string().optional().nullable(),
  trackId: z.string().optional().nullable(),
});

export type HalaqaActionState = { error?: string; success?: string };

export async function createHalaqaAction(
  _prev: HalaqaActionState | undefined,
  formData: FormData
): Promise<HalaqaActionState> {
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const parsed = halaqaSchema.safeParse({
    name: formData.get("name"),
    time: formData.get("time"),
    category: formData.get("category"),
    teacherId: formData.get("teacherId") || null,
    supervisorId: formData.get("supervisorId") || null,
    trackId: formData.get("trackId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { name, time, category, teacherId, trackId } = parsed.data;
  // المشرفة تُنشئ حلقات تحت إشرافها تلقائيًا، المديرة تختار المشرفة
  const supervisorId =
    user.role === "SUPERVISOR" ? user.id : parsed.data.supervisorId || null;

  if (teacherId) {
    const existing = await db.halaqa.findUnique({ where: { teacherId } });
    if (existing) {
      return { error: "هذه المعلمة مرتبطة بحلقة أخرى بالفعل" };
    }
  }

  const halaqa = await db.halaqa.create({
    data: { name, time, category, teacherId: teacherId || null, supervisorId, trackId: trackId || null },
  });

  await logAudit({
    actor: user,
    action: "HALAQA_CREATE",
    targetType: "Halaqa",
    targetId: halaqa.id,
    targetLabel: halaqa.name,
    message: "أنشأت حلقة جديدة",
  });

  revalidatePath("/halaqat");
  revalidatePath("/");
  redirect(`/halaqat/${halaqa.id}`);
}

export async function updateHalaqaAction(
  halaqaId: string,
  _prev: HalaqaActionState | undefined,
  formData: FormData
): Promise<HalaqaActionState> {
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const parsed = halaqaSchema.safeParse({
    name: formData.get("name"),
    time: formData.get("time"),
    category: formData.get("category"),
    teacherId: formData.get("teacherId") || null,
    supervisorId: formData.get("supervisorId") || null,
    trackId: formData.get("trackId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return { error: "الحلقة غير موجودة" };
  if (user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id) {
    return { error: "لا تملكين صلاحية تعديل هذه الحلقة" };
  }

  const { name, time, category, teacherId, trackId } = parsed.data;

  if (teacherId) {
    const existing = await db.halaqa.findUnique({ where: { teacherId } });
    if (existing && existing.id !== halaqaId) {
      return { error: "هذه المعلمة مرتبطة بحلقة أخرى بالفعل" };
    }
  }

  const supervisorId =
    user.role === "SUPERVISOR" ? user.id : parsed.data.supervisorId || null;

  await db.halaqa.update({
    where: { id: halaqaId },
    data: { name, time, category, teacherId: teacherId || null, supervisorId, trackId: trackId || null },
  });

  await logAudit({
    actor: user,
    action: "HALAQA_UPDATE",
    targetType: "Halaqa",
    targetId: halaqaId,
    targetLabel: name,
    message: "عدّلت بيانات الحلقة",
  });

  revalidatePath("/halaqat");
  revalidatePath(`/halaqat/${halaqaId}`);
  revalidatePath("/");
  redirect(`/halaqat/${halaqaId}`);
}

export async function toggleHalaqaActiveAction(halaqaId: string) {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return;
  if (user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id) return;

  await db.halaqa.update({
    where: { id: halaqaId },
    data: { isActive: !halaqa.isActive },
  });

  await logAudit({
    actor: user,
    action: halaqa.isActive ? "HALAQA_DEACTIVATE" : "HALAQA_ACTIVATE",
    targetType: "Halaqa",
    targetId: halaqaId,
    targetLabel: halaqa.name,
    message: halaqa.isActive ? "عطّلت الحلقة" : "فعّلت الحلقة",
  });

  revalidatePath("/halaqat");
  revalidatePath("/");
}

/** حذف الحلقة نهائيًا - يُمنع إذا كان لديها طالبات أو سجلات حضور مرتبطة، لحماية بيانات الطالبات من الضياع */
export async function deleteHalaqaAction(
  halaqaId: string
): Promise<{ error?: string } | void> {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return;
  if (user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id) {
    return { error: "لا تملكين صلاحية حذف هذه الحلقة" };
  }

  const [studentsCount, attendanceCount] = await Promise.all([
    db.student.count({ where: { halaqaId } }),
    db.attendanceLog.count({ where: { halaqaId } }),
  ]);

  if (studentsCount > 0 || attendanceCount > 0) {
    return {
      error:
        "لا يمكن حذف الحلقة لوجود طالبات أو سجلات حضور مرتبطة بها. يمكنك تعطيل الحلقة بدلًا من ذلك من صفحة تعديلها.",
    };
  }

  await db.halaqa.delete({ where: { id: halaqaId } });

  await logAudit({
    actor: user,
    action: "HALAQA_DELETE",
    targetType: "Halaqa",
    targetId: halaqaId,
    targetLabel: halaqa.name,
    message: `حذفت الحلقة "${halaqa.name}"`,
  });

  revalidatePath("/halaqat");
  revalidatePath("/");
  revalidatePath("/tracks", "layout");
}
