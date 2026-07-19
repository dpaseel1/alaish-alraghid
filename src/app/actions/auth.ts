"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  hashNationalId,
  encryptNationalId,
  lastFourOf,
} from "@/lib/crypto";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

// حماية تسجيل الدخول من محاولات التخمين المتكررة
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    nationalId: formData.get("nationalId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { nationalId, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { nationalIdHash: hashNationalId(nationalId) },
  });

  if (!user) {
    return { error: "رقم الهوية/الإقامة أو كلمة المرور غير صحيحة" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.max(
      1,
      Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    );
    return {
      error: `تم إيقاف الدخول لهذا الحساب مؤقتًا بسبب محاولات كثيرة خاطئة. حاولي مرة أخرى بعد ${minutesLeft} دقيقة، أو تواصلي مع المطورة لإعادة الضبط فورًا.`,
    };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      return {
        error: `تم إيقاف الدخول لهذا الحساب مؤقتًا لمدة ${LOCKOUT_MINUTES} دقيقة بسبب تكرار كلمة المرور الخاطئة. تواصلي مع المطورة إن احتجتِ لإعادة الضبط فورًا.`,
      };
    }

    return { error: "رقم الهوية/الإقامة أو كلمة المرور غير صحيحة" };
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  if (user.status === "PENDING") {
    return { error: "حسابك بانتظار موافقة المديرة، يرجى المحاولة لاحقًا" };
  }
  if (user.status === "REJECTED") {
    return { error: "تم رفض طلب انضمامك. يرجى التواصل مع المديرة" };
  }
  if (user.status === "SUSPENDED") {
    return { error: "تم إيقاف هذا الحساب. يرجى التواصل مع المديرة" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function registerAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    nationalId: formData.get("nationalId"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
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
    phone,
    nationality,
    age,
    educationLevel,
    residence,
    memorizedAmount,
    experience,
  } = parsed.data;
  const nationalIdHash = hashNationalId(nationalId);

  const existing = await db.user.findUnique({ where: { nationalIdHash } });
  if (existing) {
    return { error: "يوجد حساب مسجّل مسبقًا بهذا الرقم" };
  }

  await db.user.create({
    data: {
      name,
      nationalIdHash,
      nationalIdEncrypted: encryptNationalId(nationalId),
      nationalIdLastFour: lastFourOf(nationalId),
      passwordHash: await hashPassword(password),
      role: "TEACHER",
      status: "PENDING",
      phone: phone || null,
      nationality: nationality || null,
      age: age ?? null,
      educationLevel: educationLevel || null,
      residence: residence || null,
      memorizedAmount: memorizedAmount || null,
      experience: experience || null,
    },
  });

  return {
    success:
      "تم إنشاء الحساب بنجاح. بانتظار موافقة المديرة قبل ما تقدرين تسجّلين الدخول.",
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
