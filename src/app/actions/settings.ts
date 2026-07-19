"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { passwordSchema, nameSchema, requiredProfileFields } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { fileToAvatarDataUrl } from "@/lib/avatar";

export type SettingsActionState = { error?: string; success?: string };

const baseProfileSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().optional().or(z.literal("")),
});

const extendedProfileSchema = baseProfileSchema.extend({
  ...requiredProfileFields,
});

export async function updateProfileAction(
  _prev: SettingsActionState | undefined,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();
  const isExtended = user.role === "TEACHER" || user.role === "SUPERVISOR";

  const parsed = isExtended
    ? extendedProfileSchema.safeParse({
        name: formData.get("name"),
        phone: formData.get("phone"),
        nationality: formData.get("nationality"),
        age: formData.get("age"),
        educationLevel: formData.get("educationLevel"),
        residence: formData.get("residence"),
        memorizedAmount: formData.get("memorizedAmount"),
        experience: formData.get("experience"),
      })
    : baseProfileSchema.safeParse({
        name: formData.get("name"),
        phone: formData.get("phone"),
      });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { dataUrl: avatarUrl, error: avatarError } = await fileToAvatarDataUrl(
    formData.get("avatar")
  );
  if (avatarError) return { error: avatarError };

  const extraFields = isExtended
    ? (parsed.data as z.infer<typeof extendedProfileSchema>)
    : null;

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(extraFields
        ? {
            nationality: extraFields.nationality,
            age: extraFields.age,
            educationLevel: extraFields.educationLevel,
            residence: extraFields.residence,
            memorizedAmount: extraFields.memorizedAmount,
            experience: extraFields.experience,
          }
        : {}),
    },
  });

  await logAudit({
    actor: user,
    action: "PROFILE_UPDATE",
    targetType: "User",
    targetId: user.id,
    targetLabel: parsed.data.name,
    message: "حدّثت بيانات حسابها الشخصية",
  });

  revalidatePath("/settings");
  return { success: "تم تحديث بيانات الحساب بنجاح" };
}

const schema = z
  .object({
    currentPassword: z.string().min(1, "الرجاء إدخال كلمة المرور الحالية"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "كلمتا المرور الجديدتان غير متطابقتين",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: SettingsActionState | undefined,
  formData: FormData
): Promise<SettingsActionState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "كلمة المرور الحالية غير صحيحة" };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { success: "تم تغيير كلمة المرور بنجاح" };
}

export async function updateLogoAction(
  _prev: SettingsActionState | undefined,
  formData: FormData
): Promise<SettingsActionState> {
  const actor = await requireRole("ADMIN");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "الرجاء اختيار صورة للشعار" };
  }

  const { dataUrl, error } = await fileToAvatarDataUrl(file);
  if (error) return { error };
  if (!dataUrl) return { error: "الرجاء اختيار صورة للشعار" };

  await db.appSettings.upsert({
    where: { id: "main" },
    create: { id: "main", logoUrl: dataUrl },
    update: { logoUrl: dataUrl },
  });

  await logAudit({
    actor,
    action: "APP_LOGO_UPDATE",
    targetType: "AppSettings",
    targetId: "main",
    targetLabel: "شعار الموقع",
    message: "حدّثت شعار الموقع",
  });

  revalidatePath("/", "layout");
  return { success: "تم تحديث شعار الموقع بنجاح" };
}

export async function removeLogoAction() {
  const actor = await requireRole("ADMIN");

  await db.appSettings.upsert({
    where: { id: "main" },
    create: { id: "main", logoUrl: null },
    update: { logoUrl: null },
  });

  await logAudit({
    actor,
    action: "APP_LOGO_REMOVE",
    targetType: "AppSettings",
    targetId: "main",
    targetLabel: "شعار الموقع",
    message: "أزالت شعار الموقع",
  });

  revalidatePath("/", "layout");
}
