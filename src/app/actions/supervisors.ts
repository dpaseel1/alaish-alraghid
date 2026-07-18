"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import {
  hashPassword,
  hashNationalId,
  encryptNationalId,
  lastFourOf,
} from "@/lib/crypto";
import { nameSchema, nationalIdSchema, passwordSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export type SupervisorActionState = { error?: string; success?: string };

const createSchema = {
  parse: (data: { name: FormDataEntryValue | null; nationalId: FormDataEntryValue | null; password: FormDataEntryValue | null }) => {
    const name = nameSchema.safeParse(data.name);
    if (!name.success) return { error: name.error.issues[0]?.message };
    const nid = nationalIdSchema.safeParse(data.nationalId);
    if (!nid.success) return { error: nid.error.issues[0]?.message };
    const pass = passwordSchema.safeParse(data.password);
    if (!pass.success) return { error: pass.error.issues[0]?.message };
    return { name: name.data, nationalId: nid.data, password: pass.data };
  },
};

export async function createSupervisorAction(
  _prev: SupervisorActionState | undefined,
  formData: FormData
): Promise<SupervisorActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = createSchema.parse({
    name: formData.get("name"),
    nationalId: formData.get("nationalId"),
    password: formData.get("password"),
  });

  if ("error" in parsed) return { error: parsed.error ?? "بيانات غير صحيحة" };

  const nationalIdHash = hashNationalId(parsed.nationalId);
  const existing = await db.user.findUnique({ where: { nationalIdHash } });
  if (existing) return { error: "يوجد حساب مسجّل مسبقًا بهذا السجل المدني" };

  const supervisor = await db.user.create({
    data: {
      name: parsed.name,
      nationalIdHash,
      nationalIdEncrypted: encryptNationalId(parsed.nationalId),
      nationalIdLastFour: lastFourOf(parsed.nationalId),
      passwordHash: await hashPassword(parsed.password),
      role: "SUPERVISOR",
      status: "ACTIVE",
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
