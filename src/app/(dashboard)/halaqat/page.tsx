import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { HALAQA_CATEGORY_LABELS } from "@/lib/halaqaCategory";
import { HALAQA_DAY_LABELS, type HalaqaDay } from "@/lib/halaqaDays";
import { DeleteHalaqaButton } from "@/components/halaqat/DeleteHalaqaButton";
import { ToggleHalaqaActiveButton } from "@/components/halaqat/ToggleHalaqaActiveButton";

export default async function HalaqatPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const user = await requireUser();
  const { archived } = await searchParams;
  const isArchiveView = archived === "1";

  if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({ where: { teacherId: user.id } });
    if (halaqa) redirect(`/halaqat/${halaqa.id}`);
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800">
        لم يتم تعيين حلقة لحسابك بعد. يرجى التواصل مع المديرة.
      </div>
    );
  }

  const where = {
    isActive: !isArchiveView,
    ...(user.role === "SUPERVISOR" ? { trackId: user.supervisedTrackId ?? "__no_track__" } : {}),
  };

  const halaqat = await db.halaqa.findMany({
    where,
    include: {
      teacher: { select: { name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الحلقات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isArchiveView
              ? "الحلقات المؤرشفة — يمكنك إلغاء أرشفتها في أي وقت"
              : "إدارة حلقات التحفيظ وربطها بالمعلمات"}
          </p>
        </div>
        {!isArchiveView && (
          <Link
            href="/halaqat/new"
            className="rounded-lg bg-brand text-white font-medium px-4 py-2.5 hover:bg-brand-dark transition"
          >
            + إضافة حلقة
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 print:hidden">
        <Link
          href="/halaqat?archived=0"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            !isArchiveView
              ? "bg-brand text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          نشطة
        </Link>
        <Link
          href="/halaqat?archived=1"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isArchiveView
              ? "bg-brand text-white"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          }`}
        >
          الأرشيف
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">اسم الحلقة</th>
                <th className="px-5 py-3 font-medium">التصنيف</th>
                <th className="px-5 py-3 font-medium">المعلمة</th>
                <th className="px-5 py-3 font-medium">المشرفة</th>
                <th className="px-5 py-3 font-medium">عدد الطالبات</th>
                <th className="px-5 py-3 font-medium">وقت الحلقة</th>
                <th className="px-5 py-3 font-medium">الأيام</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqat.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    {isArchiveView ? "لا توجد حلقات مؤرشفة" : "لا توجد حلقات مضافة بعد"}
                  </td>
                </tr>
              )}
              {halaqat.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{h.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {h.category ? HALAQA_CATEGORY_LABELS[h.category] : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.teacher?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.supervisorName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h._count.students}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.time}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {h.days.length > 0
                      ? h.days.map((d) => HALAQA_DAY_LABELS[d as HalaqaDay]).join("، ")
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        h.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {h.isActive ? "نشطة" : "مؤرشفة"}
                    </span>
                  </td>
                  <td className="px-5 py-3 space-x-3 space-x-reverse">
                    <Link href={`/halaqat/${h.id}`} className="text-brand hover:underline">
                      عرض
                    </Link>
                    {!isArchiveView && (
                      <Link href={`/halaqat/${h.id}/edit`} className="text-slate-500 dark:text-slate-400 hover:underline">
                        تعديل
                      </Link>
                    )}
                    <ToggleHalaqaActiveButton halaqaId={h.id} name={h.name} isActive={h.isActive} />
                    {!isArchiveView && <DeleteHalaqaButton halaqaId={h.id} name={h.name} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
