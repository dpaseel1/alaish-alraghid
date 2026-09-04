"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { HALAQA_CATEGORIES } from "@/lib/halaqaCategory";
import { HALAQA_DAYS } from "@/lib/halaqaDays";
import type { HalaqaCategory } from "@/generated/prisma/client";

const halaqaSchema = z.object({
  name: z.string().trim().min(2, "اسم الحلقة قصير جدًا"),
  time: z.string().trim().min(1, "الرجاء تحديد وقت الحلقة"),
  category: z.enum(HALAQA_CATEGORIES as [HalaqaCategory, ...HalaqaCategory[]], {
    message: "الرجاء اختيار تصنيف الحلقة",
  }),
  teacherId: z.string().optional().nullable(),
  supervisorName: z.string().trim().max(100).optional().nullable(),
  trackId: z.string().optional().nullable(),
  days: z.array(z.enum(HALAQA_DAYS)).default([]),
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
    supervisorName: formData.get("supervisorName") || null,
    trackId: formData.get("trackId") || null,
    days: formData.getAll("days"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { name, time, category, teacherId, supervisorName, days } = parsed.data;

  // المشرفة تُنشئ حلقات ضمن مسارها فقط (يُفرض من الجلسة، وليس من الفورم)، والمديرة تختار المسار
  let trackId: string | null;
  if (user.role === "SUPERVISOR") {
    if (!user.supervisedTrackId) {
      return { error: "حسابك غير مرتبط بمسار بعد. يرجى التواصل مع المديرة" };
    }
    trackId = user.supervisedTrackId;
  } else {
    trackId = parsed.data.trackId || null;
  }

  if (teacherId) {
    const existing = await db.halaqa.findUnique({ where: { teacherId } });
    if (existing) {
      return { error: "هذه المعلمة مرتبطة بحلقة أخرى بالفعل" };
    }
  }

  const maxOrder = await db.halaqa.aggregate({ _max: { order: true } });

  const halaqa = await db.halaqa.create({
    data: {
      name,
      time,
      category,
      teacherId: teacherId || null,
      supervisorName: supervisorName || null,
      trackId,
      days,
      order: (maxOrder._max.order ?? -1) + 1,
    },
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
  revalidatePath("/students");
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
    supervisorName: formData.get("supervisorName") || null,
    trackId: formData.get("trackId") || null,
    days: formData.getAll("days"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return { error: "الحلقة غير موجودة" };
  if (user.role === "SUPERVISOR" && halaqa.trackId !== user.supervisedTrackId) {
    return { error: "لا تملكين صلاحية تعديل هذه الحلقة" };
  }

  const { name, time, category, teacherId, supervisorName, days } = parsed.data;

  if (teacherId) {
    const existing = await db.halaqa.findUnique({ where: { teacherId } });
    if (existing && existing.id !== halaqaId) {
      return { error: "هذه المعلمة مرتبطة بحلقة أخرى بالفعل" };
    }
  }

  const trackId = user.role === "SUPERVISOR" ? user.supervisedTrackId : parsed.data.trackId || null;

  await db.halaqa.update({
    where: { id: halaqaId },
    data: { name, time, category, teacherId: teacherId || null, supervisorName: supervisorName || null, trackId, days },
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
  revalidatePath("/students");
  redirect(`/halaqat/${halaqaId}`);
}

export async function toggleHalaqaActiveAction(halaqaId: string) {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return;
  if (user.role === "SUPERVISOR" && halaqa.trackId !== user.supervisedTrackId) return;

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

/** تُحرّك الحلقة خطوة للأعلى أو للأسفل ضمن ترتيب العرض، بتبديل قيمة الترتيب مع الحلقة المجاورة في نفس نطاق الرؤية (نشطة/مؤرشفة، ومسار المشرفة إن وُجد) */
export async function moveHalaqaAction(halaqaId: string, direction: "up" | "down") {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return;
  if (user.role === "SUPERVISOR" && halaqa.trackId !== user.supervisedTrackId) return;

  const scopeWhere = {
    isActive: halaqa.isActive,
    ...(user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId } : {}),
  };

  const neighbor = await db.halaqa.findFirst({
    where: {
      ...scopeWhere,
      OR:
        direction === "up"
          ? [{ order: { lt: halaqa.order } }, { order: halaqa.order, createdAt: { lt: halaqa.createdAt } }]
          : [{ order: { gt: halaqa.order } }, { order: halaqa.order, createdAt: { gt: halaqa.createdAt } }],
    },
    orderBy:
      direction === "up" ? [{ order: "desc" }, { createdAt: "desc" }] : [{ order: "asc" }, { createdAt: "asc" }],
  });
  if (!neighbor) return;

  await db.$transaction([
    db.halaqa.update({ where: { id: halaqa.id }, data: { order: neighbor.order } }),
    db.halaqa.update({ where: { id: neighbor.id }, data: { order: halaqa.order } }),
  ]);

  revalidatePath("/halaqat");
  revalidatePath("/");
  if (halaqa.trackId) revalidatePath(`/tracks/${halaqa.trackId}`);
}

/** حذف الحلقة نهائيًا - يُمنع إذا كان لديها طالبات أو سجلات حضور مرتبطة، لحماية بيانات الطالبات من الضياع */
export async function deleteHalaqaAction(
  halaqaId: string
): Promise<{ error?: string } | void> {
  const user = await requireRole("ADMIN", "SUPERVISOR");
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return;
  if (user.role === "SUPERVISOR" && halaqa.trackId !== user.supervisedTrackId) {
    return { error: "لا تملكين صلاحية حذف هذه الحلقة" };
  }

  const [studentsCount, attendanceCount] = await Promise.all([
    db.student.count({ where: { halaqaId } }),
    db.attendanceLog.count({ where: { halaqaId } }),
  ]);

  if (studentsCount > 0 || attendanceCount > 0) {
    return {
      error:
        "لا يمكن حذف الحلقة لوجود طالبات أو سجلات حضور مرتبطة بها. يمكنك أرشفة الحلقة بدلًا من ذلك.",
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
