"use server";

import { redirect } from "next/navigation";
import { getRawUser, startImpersonation, stopImpersonation } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export type ImpersonateActionState = { error?: string };

/**
 * تبدأ المطورة "تجربة" حساب آخر (مديرة/مشرفة/معلمة) لترى النظام والصلاحيات
 * تمامًا كما يراها ذلك الحساب. تُستدعى من نموذج في لوحة المطورة فقط.
 */
export async function startImpersonationAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const rawUser = await getRawUser();
  if (!rawUser || rawUser.role !== "DEVELOPER") redirect("/");

  const target = await startImpersonation(userId);

  await logAudit({
    actor: rawUser,
    action: "DEVELOPER_START_IMPERSONATION",
    targetType: "User",
    targetId: target.id,
    targetLabel: target.name,
    message: `بدأت المطورة "${rawUser.name}" تجربة حساب "${target.name}"`,
  });

  redirect("/");
}

/** تنهي المطورة تجربة الحساب وتعود لحسابها الأصلي. تُستدعى من شريط التنبيه في أي صفحة. */
export async function stopImpersonationAction() {
  const rawUser = await getRawUser();
  if (!rawUser || rawUser.role !== "DEVELOPER") redirect("/");

  await stopImpersonation();

  await logAudit({
    actor: rawUser,
    action: "DEVELOPER_STOP_IMPERSONATION",
    targetType: "User",
    targetId: rawUser.id,
    targetLabel: rawUser.name,
    message: `أنهت المطورة "${rawUser.name}" وضع تجربة الحساب وعادت لحسابها`,
  });

  redirect("/developer");
}
