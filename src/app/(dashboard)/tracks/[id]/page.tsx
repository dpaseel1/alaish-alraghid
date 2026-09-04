import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import { MosqueIcon, TeacherIcon, CompassIcon, BookIcon } from "@/components/icons";
import { DeleteHalaqaButton } from "@/components/halaqat/DeleteHalaqaButton";

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const isUnassigned = id === "unassigned";
  const track = isUnassigned ? null : await db.track.findUnique({ where: { id } });

  if (!isUnassigned && !track) notFound();

  if (user.role === "SUPERVISOR" && (isUnassigned || id !== user.supervisedTrackId)) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-700 dark:text-amber-400">
        لا تملكين صلاحية الوصول إلى هذا المسار.
      </div>
    );
  }

  const halaqaWhere = { trackId: isUnassigned ? null : id };

  const [halaqat, trackSupervisors] = await Promise.all([
    db.halaqa.findMany({
      where: halaqaWhere,
      include: {
        teacher: { select: { name: true } },
        students: { where: { isActive: true }, select: { memorizedPagesTotal: true, reviewedPagesTotal: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    isUnassigned
      ? Promise.resolve([])
      : db.user.findMany({
          where: { role: "SUPERVISOR", supervisedTrackId: id },
          select: { name: true, phone: true },
          orderBy: { name: "asc" },
        }),
  ]);

  const teachersCount = new Set(halaqat.filter((h) => h.teacherId).map((h) => h.teacherId)).size;
  const supervisorsCount = trackSupervisors.length;
  const studentsCount = halaqat.reduce((sum, h) => sum + h.students.length, 0);
  const memorizedTotal = halaqat.reduce(
    (sum, h) => sum + h.students.reduce((s, st) => s + st.memorizedPagesTotal, 0),
    0
  );
  const reviewedTotal = halaqat.reduce(
    (sum, h) => sum + h.students.reduce((s, st) => s + st.reviewedPagesTotal, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {track?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.imageUrl}
              alt={track.name}
              className="h-14 w-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand">
              <CompassIcon className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {track?.name ?? "حلقات غير مصنّفة ضمن مسار"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {halaqat.length} حلقة ضمن هذا المسار
            </p>
          </div>
        </div>
        <Link href="/" className="text-sm text-brand font-medium hover:underline">
          الرجوع للرئيسية
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="عدد الحلقات" value={halaqat.length} icon={<MosqueIcon className="h-6 w-6" />} />
        <StatCard label="عدد المعلمات" value={teachersCount} icon={<TeacherIcon className="h-6 w-6" />} />
        <StatCard label="عدد المشرفات" value={supervisorsCount} icon={<CompassIcon className="h-6 w-6" />} />
        <StatCard label="عدد الطالبات" value={studentsCount} icon={<BookIcon className="h-6 w-6" />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="إجمالي الأوجه المحفوظة" value={memorizedTotal} icon={<BookIcon className="h-6 w-6" />} />
        <StatCard label="إجمالي أوجه المراجعة" value={reviewedTotal} icon={<BookIcon className="h-6 w-6" />} />
      </div>

      {!isUnassigned && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">مشرفات المسار</h2>
          </div>
          <div className="p-5">
            {trackSupervisors.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">لا توجد مشرفة مرتبطة بهذا المسار بعد</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {trackSupervisors.map((s, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-slate-800 dark:text-slate-100 font-medium">{s.name}</span>
                    <span className="text-slate-500 dark:text-slate-400" dir="ltr">{s.phone ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">حلقات المسار</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">اسم الحلقة</th>
                <th className="px-5 py-3 font-medium">المعلمة</th>
                <th className="px-5 py-3 font-medium">المشرفة</th>
                <th className="px-5 py-3 font-medium">عدد الطالبات</th>
                <th className="px-5 py-3 font-medium">الأوجه المحفوظة</th>
                <th className="px-5 py-3 font-medium">أوجه المراجعة</th>
                <th className="px-5 py-3 font-medium">وقت الحلقة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqat.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد حلقات ضمن هذا المسار بعد
                  </td>
                </tr>
              )}
              {halaqat.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{h.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.teacher?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.supervisorName ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.students.length}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {h.students.reduce((sum, s) => sum + s.memorizedPagesTotal, 0)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {h.students.reduce((sum, s) => sum + s.reviewedPagesTotal, 0)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.time}</td>
                  <td className="px-5 py-3">
                    <Link href={`/halaqat/${h.id}`} className="text-brand hover:underline ml-3">
                      عرض
                    </Link>
                    <Link
                      href={`/halaqat/${h.id}/edit`}
                      className="text-slate-500 dark:text-slate-400 hover:underline ml-3"
                    >
                      تعديل
                    </Link>
                    <DeleteHalaqaButton halaqaId={h.id} name={h.name} />
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
