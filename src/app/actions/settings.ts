"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { passwordSchema } from "@/lib/validation";

export type SettingsActionState = { error?: string; success?: string };

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
