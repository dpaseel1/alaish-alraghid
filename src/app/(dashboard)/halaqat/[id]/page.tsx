import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function HalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const halaqa = await db.halaqa.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      supervisor: { select: { name: true } },
      students: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  if (!halaqa) notFound();

  const canManage =
    user.role === "ADMIN" ||
    (user.role === "SUPERVISOR" && halaqa.supervisorId === user.id) ||
    (user.role === "TEACHER" && halaqa.teacherId === user.id);

  if (
    user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id
  ) {
    // مشرفة تحاول الدخول لحلقة ليست تحت إشرافها
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        لا تملكين صلاحية عرض هذه الحلقة
      </div>
    );
  }
  if (user.role === "TEACHER" && halaqa.teacherId !== user.id) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        لا تملكين صلاحية عرض هذه الحلقة
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{halaqa.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {halaqa.time} · المعلمة: {halaqa.teacher?.name ?? "—"} · المشرفة:{" "}
            {halaqa.supervisor?.name ?? "—"}
          </p>
        </div>
        {canManage && (user.role === "ADMIN" || user.role === "SUPERVISOR") && (
          <Link
            href={`/halaqat/${halaqa.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
          >
            تعديل الحلقة
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            طالبات الحلقة ({halaqa.students.length})
          </h2>
          <Link href="/students" className="text-sm text-brand font-medium hover:underline">
            إدارة الطالبات
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجنسية</th>
                <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                <th className="px-5 py-3 font-medium">النصاب الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {halaqa.students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    لا توجد طالبات مضافات بعد
                  </td>
                </tr>
              )}
              {halaqa.students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600">{s.nationality}</td>
                  <td className="px-5 py-3 text-slate-600">{s.memorizedPagesTotal}</td>
                  <td className="px-5 py-3 text-slate-600">{s.currentQuota ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
