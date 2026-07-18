import "server-only";
import { db } from "@/lib/db";
import { getImpersonationView } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

type Actor = { id: string; name: string; role: Role };

/**
 * يسجّل عملية في سجل الحركات (Audit Log) لمراجعتها لاحقًا من قبل المديرة.
 * تُستدعى بعد نجاح أي عملية إضافة/تعديل/حذف مهمة.
 *
 * إذا كانت العملية قد تمّت أثناء "تجربة حساب" من المطورة، تُضاف إشارة لذلك
 * في نص الرسالة حتى تبقى الشفافية كاملة في سجل الحركات رغم أن actor هنا هو
 * الحساب المُجرَّب نفسه (لأن هذا هو ما تراه بقية أفعال النظام).
 */
export async function logAudit({
  actor,
  action,
  targetType,
  targetId,
  targetLabel,
  message,
}: {
  actor: Actor;
  action: string;
  targetType: string;
  targetId?: string;
  targetLabel: string;
  message: string;
}) {
  try {
    let finalMessage = message;
    const impersonation = await getImpersonationView().catch(() => null);
    if (impersonation && impersonation.targetUser.id === actor.id) {
      finalMessage = `${message} [عبر وضع تجربة الحساب من المطورة "${impersonation.realUser.name}"]`;
    }

    await db.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        targetType,
        targetId,
        targetLabel,
        message: finalMessage,
      },
    });
  } catch (err) {
    // لا نريد لفشل تسجيل السجل أن يفشل العملية الأساسية نفسها
    console.error("audit log write failed:", err);
  }
}
