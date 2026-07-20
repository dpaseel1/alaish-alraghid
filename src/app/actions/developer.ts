"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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
  teacherProfileFields,
  validateRequiredProfileFieldsForRole,
} from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { fileToAvatarDataUrl } from "@/lib/avatar";
import type { Role, UserStatus } from "@/generated/prisma/client";

export type DeveloperActionState = { error?: string; success?: string };

const ROLES: Role[] = ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"];
const STATUSES: UserStatus[] = ["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"];

const updateSchema = z.object({
  name: nameSchema,
  nationalId: nationalIdSchema,
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(ROLES as [Role, ...Role[]]),
  status: z.enum(STATUSES as [UserStatus, ...UserStatus[]]),
  newPassword: z.string().optional().or(z.literal("")),
  ...teacherProfileFields,
});

export async function updateUserByDeveloperAction(
  userId: string,
  _prev: DeveloperActionState | undefined,
  formData: FormData
): Promise<DeveloperActionState> {
  const actor = await requireRole("DEVELOPER");

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    nationalId: formData.get("nationalId"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    status: formData.get("status"),
    newPassword: formData.get("newPassword"),
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
    phone,
    role,
    status,
    newPassword,
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  } = parsed.data;

  const profileError = validateRequiredProfileFieldsForRole(role, {
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  });
  if (profileError) return { error: profileError };

  // منع المطورة من تغيير صفتها الخاصة عن طريق الخطأ (تفادي فقدان الوصول)
  if (userId === actor.id && role !== "DEVELOPER") {
    return { error: "لا يمكنك تغيير صفتك الخاصة" };
  }

  if (newPassword && newPassword.length > 0 && newPassword.length < 8) {
    return { error: "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف" };
  }

  const { dataUrl: avatarUrl, error: avatarError } = await fileToAvatarDataUrl(
    formData.get("avatar")
  );
  if (avatarError) return { error: avatarError };

  const nationalIdHash = hashNationalId(nationalId);
  const existing = await db.user.findUnique({ where: { nationalIdHash } });
  if (existing && existing.id !== userId) {
    return { error: "يوجد حساب آخر مسجّل بهذا الرقم" };
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "الحساب غير موجود" };

  await db.user.update({
    where: { id: userId },
    data: {
      name,
      phone: phone || null,
      role,
      status,
      nationalIdHash,
      nationalIdEncrypted: encryptNationalId(nationalId),
      nationalIdLastFour: lastFourOf(nationalId),
      nationality: nationality || null,
      age: age ?? null,
      educationLevel: educationLevel || null,
      residence: residence || null,
      memorizedAmount: memorizedAmount || null,
      experience: experience || null,
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
    },
  });

  await logAudit({
    actor,
    action: "DEVELOPER_UPDATE_USER",
    targetType: "User",
    targetId: userId,
    targetLabel: name,
    message: `عدّلت المطورة بيانات حساب "${target.name}"`,
  });

  revalidatePath("/developer");
  return { success: "تم حفظ التعديلات بنجاح" };
}

const createSchema = z.object({
  name: nameSchema,
  nationalId: nationalIdSchema,
  password: passwordSchema,
  role: z.enum(ROLES as [Role, ...Role[]]),
  phone: z.string().trim().optional().or(z.literal("")),
  ...teacherProfileFields,
});

export async function createUserByDeveloperAction(
  _prev: DeveloperActionState | undefined,
  formData: FormData
): Promise<DeveloperActionState> {
  const actor = await requireRole("DEVELOPER");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    nationalId: formData.get("nationalId"),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone"),
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
    role,
    phone,
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  } = parsed.data;

  const profileError = validateRequiredProfileFieldsForRole(role, {
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  });
  if (profileError) return { error: profileError };

  const { dataUrl: avatarUrl, error: avatarError } = await fileToAvatarDataUrl(
    formData.get("avatar")
  );
  if (avatarError) return { error: avatarError };

  const nationalIdHash = hashNationalId(nationalId);
  const existing = await db.user.findUnique({ where: { nationalIdHash } });
  if (existing) return { error: "يوجد حساب مسجّل مسبقًا بهذا الرقم" };

  const created = await db.user.create({
    data: {
      name,
      nationalIdHash,
      nationalIdEncrypted: encryptNationalId(nationalId),
      nationalIdLastFour: lastFourOf(nationalId),
      passwordHash: await hashPassword(password),
      role,
      status: "ACTIVE",
      phone: phone || null,
      nationality: nationality || null,
      age: age ?? null,
      educationLevel: educationLevel || null,
      residence: residence || null,
      memorizedAmount: memorizedAmount || null,
      experience: experience || null,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  await logAudit({
    actor,
    action: "DEVELOPER_CREATE_USER",
    targetType: "User",
    targetId: created.id,
    targetLabel: created.name,
    message: `أنشأت المطورة حساب "${created.name}" بصفة ${role}`,
  });

  revalidatePath("/developer");
  return { success: "تم إنشاء الحساب بنجاح" };
}

/** إعادة ضبط محاولات الدخول الفاشلة وإلغاء الإيقاف المؤقت عن حساب - تُستخدم من لوحة المطورة */
export async function resetLoginLockoutAction(userId: string) {
  const actor = await requireRole("DEVELOPER");

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;

  await db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await logAudit({
    actor,
    action: "DEVELOPER_RESET_LOGIN_LOCKOUT",
    targetType: "User",
    targetId: userId,
    targetLabel: target.name,
    message: `أعادت المطورة ضبط محاولات الدخول الفاشلة لحساب "${target.name}"`,
  });

  revalidatePath("/developer");
}

export async function deleteUserByDeveloperAction(userId: string) {
  const actor = await requireRole("DEVELOPER");
  if (userId === actor.id) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;

  await db.user.delete({ where: { id: userId } });

  await logAudit({
    actor,
    action: "DEVELOPER_DELETE_USER",
    targetType: "User",
    targetId: userId,
    targetLabel: target.name,
    message: `حذفت المطورة حساب "${target.name}"`,
  });

  revalidatePath("/developer");
}
