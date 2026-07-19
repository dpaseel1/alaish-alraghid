"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  hashPassword,
  hashNationalId,
  encryptNationalId,
  lastFourOf,
} from "@/lib/crypto";
import {
  nameSchema,
  nationalIdSchema,
  passwordSchema,
  requiredProfileFields,
} from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export type SupervisorActionState = { error?: string; success?: string };

const createSchema = z.object({
  name: nameSchema,
  nationalId: nationalIdSchema,
  password: passwordSchema,
  ...requiredProfileFields,
});

export async function createSupervisorAction(
  _prev: SupervisorActionState | undefined,
  formData: FormData
): Promise<SupervisorActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    nationalId: formData.get("nationalId"),
    password: formData.get("password"),
    nationality: formData.get("nationality"),
    age: formData.get("age"),
    educationLevel: formData.get("educationLevel"),
    residence: formData.get("residence"),
    memorizedAmount: formData.get("memorizedAmount"),
    experience: formData.get("experience"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const {
    name,
    nationalId,
    password,
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  } = parsed.data;

  const nationalIdHash = hashNationalId(nationalId);
  const existing = await db.user.findUnique({ where: { nationalIdHash } });
  if (existing) return { error: "يوجد حساب مسجّل مسبقًا بهذا الرقم" };

  const supervisor = await db.user.create({
    data: {
      name,
      nationalIdHash,
      nationalIdEncrypted: encryptNationalId(nationalId),
      nationalIdLastFour: lastFourOf(nationalId),
      passwordHash: await hashPassword(password),
      role: "SUPERVISOR",
      status: "ACTIVE",
      nationality,
      age,
      educationLevel,
      residence,
      memorizedAmount,
      experience,
    },
  });

  await logAudit({
    actor,
    action: "SUPERVISOR_CREATE",
    targetType: "User",
    targetId: supervisor.id,
    targetLabel: supervisor.name,
    message: "أنشأت حساب مشرفة جديدة",
  });

  revalidatePath("/supervisors");
  return { success: "تم إنشاء حساب المشرفة بنجاح" };
}

export async function suspendSupervisorAction(userId: string) {
  const actor = await requireRole("ADMIN");
  const supervisor = await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await logAudit({
    actor,
    action: "SUPERVISOR_SUSPEND",
    targetType: "User",
    targetId: supervisor.id,
    targetLabel: supervisor.name,
    message: "أوقفت حساب المشرفة",
  });
  revalidatePath("/supervisors");
}

export async function reactivateSupervisorAction(userId: string) {
  const actor = await requireRole("ADMIN");
  const supervisor = await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logAudit({
    actor,
    action: "SUPERVISOR_REACTIVATE",
    targetType: "User",
    targetId: supervisor.id,
    targetLabel: supervisor.name,
    message: "أعادت تفعيل حساب المشرفة",
  });
  revalidatePath("/supervisors");
}
