import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import { MosqueIcon, TeacherIcon, CompassIcon, BookIcon } from "@/components/icons";

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

  const halaqaWhere = {
    trackId: isUnassigned ? null : id,
    ...(user.role === "SUPERVISOR" ? { supervisorId: user.id } : {}),
  };

  const halaqat = await db.halaqa.findMany({
    where: halaqaWhere,
    include: {
      teacher: { select: { name: true } },
      supervisor: { select: { name: true } },
      students: { where: { isActive: true }, select: { memorizedPagesTotal: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const teachersCount = new Set(halaqat.filter((h) => h.teacherId).map((h) => h.teacherId)).size;
  const supervisorsCount = new Set(halaqat.filter((h) => h.supervisorId).map((h) => h.supervisorId)).size;
  const studentsCount = halaqat.reduce((sum, h) => sum + h.students.length, 0);
  const memorizedTotal = halaqat.reduce(
    (sum, h) => sum + h.students.reduce((s, st) => s + st.memorizedPagesTotal, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {track?.name ?? "حلقات غير مصنّفة ضمن مسار"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {halaqat.length} حلقة ضمن هذا المسار
          </p>
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

      <StatCard label="إجمالي الأوجه المحفوظة" value={memorizedTotal} icon={<BookIcon className="h-6 w-6" />} />

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
                <th className="px-5 py-3 font-medium">وقت الحلقة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqat.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد حلقات ضمن هذا المسار بعد
                  </td>
                </tr>
              )}
              {halaqat.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{h.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.teacher?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.supervisor?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.students.length}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{h.time}</td>
                  <td className="px-5 py-3">
                    <Link href={`/halaqat/${h.id}`} className="text-brand hover:underline ml-3">
                      عرض
                    </Link>
                    <Link
                      href={`/halaqat/${h.id}/edit`}
                      className="text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      تعديل
                    </Link>
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
