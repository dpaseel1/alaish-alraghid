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

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "رقم الهوية/الإقامة أو كلمة المرور غير صحيحة" };
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
