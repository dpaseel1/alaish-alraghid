// @ts-nocheck
// سكربت هجرة تاريخي نُفِّذ مرة واحدة بنجاح (راجعي رسالة الـ commit)، ولم يعد يتوافق
// مع سكيما Prisma الحالية بعد حذف Halaqa.supervisorId/supervisor. أُبقي عليه كمرجع تاريخي فقط.
import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  // 1) احفظي اسم مشرفة الحلقة الحالية في الحقل النصي الجديد (فقط إن كان فارغًا)
  const halaqatWithSupervisor = await db.halaqa.findMany({
    where: { supervisorId: { not: null }, supervisorName: null },
    include: { supervisor: { select: { name: true } } },
  });
  for (const h of halaqatWithSupervisor) {
    if (!h.supervisor) continue;
    await db.halaqa.update({
      where: { id: h.id },
      data: { supervisorName: h.supervisor.name },
    });
  }

  // 2) لكل مشرفة، حددي مسارها الجديد من حلقاتها السابقة
  const supervisors = await db.user.findMany({ where: { role: "SUPERVISOR" } });

  let assignedNoHalaqat = 0;
  let assignedSingleTrack = 0;
  let assignedAmbiguous = 0;

  for (const supervisor of supervisors) {
    const halaqat = await db.halaqa.findMany({
      where: { supervisorId: supervisor.id },
      select: { trackId: true },
      orderBy: { createdAt: "asc" },
    });

    const trackIds = halaqat.map((h) => h.trackId).filter((id): id is string => id !== null);

    if (trackIds.length === 0) {
      assignedNoHalaqat++;
      continue;
    }

    const uniqueTrackIds = Array.from(new Set(trackIds));

    if (uniqueTrackIds.length === 1) {
      await db.user.update({
        where: { id: supervisor.id },
        data: { supervisedTrackId: uniqueTrackIds[0] },
      });
      assignedSingleTrack++;
      continue;
    }

    // تعدد قيم مختلفة: اختاري الأكثر تكرارًا (mode)، وعند التعادل الأقدم (الترتيب أعلاه بالفعل asc بحسب createdAt)
    const counts = new Map<string, number>();
    for (const id of trackIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    let bestTrackId = trackIds[0];
    let bestCount = 0;
    for (const id of trackIds) {
      const count = counts.get(id) ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestTrackId = id;
      }
    }

    await db.user.update({
      where: { id: supervisor.id },
      data: { supervisedTrackId: bestTrackId },
    });

    await db.auditLog.create({
      data: {
        actorId: "SYSTEM_MIGRATION",
        actorName: "سكربت الهجرة",
        actorRole: "DEVELOPER",
        action: "SUPERVISOR_TRACK_MIGRATION_AMBIGUOUS",
        targetType: "User",
        targetId: supervisor.id,
        targetLabel: supervisor.name,
        message: `تم ترحيل المشرفة "${supervisor.name}" تلقائيًا إلى مسار متعدد الاحتمالات (${uniqueTrackIds.length} مسارات مختلفة سابقًا). تم اختيار المسار الأكثر تكرارًا (${bestTrackId}). يُرجى المراجعة اليدوية.`,
      },
    });
    assignedAmbiguous++;
  }

  console.log("=== تقرير هجرة مشرفات الحلقات إلى مشرفات المسار ===");
  console.log(`إجمالي المشرفات: ${supervisors.length}`);
  console.log(`- بدون حلقات سابقة (بقيت بلا مسار): ${assignedNoHalaqat}`);
  console.log(`- مسار واحد واضح: ${assignedSingleTrack}`);
  console.log(`- غامضة (تحتاج مراجعة يدوية، سُجّلت في AuditLog): ${assignedAmbiguous}`);
  console.log(`أسماء المشرفات المحفوظة كـ supervisorName على الحلقات: ${halaqatWithSupervisor.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
