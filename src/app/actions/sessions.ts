"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, requireRole, getCurrentSessionToken } from "@/lib/session";
import { logAudit } from "@/lib/audit";

/** تنهي المستخدمة جلسة واحدة من جلساتها النشطة (من جهاز آخر) - لا يمكن إنهاء الجلسة الحالية بهذا الإجراء */
export async function revokeSessionAction(sessionId: string) {
  const user = await requireUser();
  const currentToken = await getCurrentSessionToken();

  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== user.id) return;
  if (session.token === currentToken) return; // استخدمي زر "تسجيل الخروج" للجلسة الحالية

  await db.session.delete({ where: { id: sessionId } });

  await logAudit({
    actor: user,
    action: "SESSION_REVOKE",
    targetType: "Session",
    targetId: session.id,
    targetLabel: user.name,
    message: "أنهت إحدى جلساتها النشطة من جهاز آخر",
  });

  revalidatePath("/settings");
}

/** تنهي المستخدمة كل جلساتها الأخرى (على أجهزة أخرى) دفعة واحدة */
export async function revokeOtherSessionsAction() {
  const user = await requireUser();
  const currentToken = await getCurrentSessionToken();
  if (!currentToken) return;

  const result = await db.session.deleteMany({
    where: { userId: user.id, token: { not: currentToken } },
  });

  if (result.count > 0) {
    await logAudit({
      actor: user,
      action: "SESSION_REVOKE_OTHERS",
      targetType: "Session",
      targetLabel: user.name,
      message: `أنهت جلساتها على الأجهزة الأخرى (${result.count})`,
    });
  }

  revalidatePath("/settings");
}

/** المطورة حصرًا: إنهاء كل جلسات مستخدمة أخرى (لحساب مشبوه أو مُوقَف) */
export async function forceLogoutUserAction(userId: string) {
  const actor = await requireRole("DEVELOPER");

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return;

  const result = await db.session.deleteMany({ where: { userId } });

  await logAudit({
    actor,
    action: "FORCE_LOGOUT_USER",
    targetType: "User",
    targetId: target.id,
    targetLabel: target.name,
    message: `أنهت كل جلسات الحساب (${result.count} جلسة)`,
  });

  revalidatePath("/teachers");
  revalidatePath("/supervisors");
  revalidatePath("/developer");
}
