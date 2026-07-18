import "server-only";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

type Actor = { id: string; name: string; role: Role };

/**
 * يسجّل عملية في سجل الحركات (Audit Log) لمراجعتها لاحقًا من قبل المديرة.
 * تُستدعى بعد نجاح أي عملية إضافة/تعديل/حذف مهمة.
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
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        targetType,
        targetId,
        targetLabel,
        message,
      },
    });
  } catch (err) {
    // لا نريد لفشل تسجيل السجل أن يفشل العملية الأساسية نفسها
    console.error("audit log write failed:", err);
  }
}
