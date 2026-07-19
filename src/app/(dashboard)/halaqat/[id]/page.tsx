import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, isAdminRole } from "@/lib/session";
import { db } from "@/lib/db";
import { RevealNationalId } from "@/components/teachers/RevealNationalId";
import { Avatar } from "@/components/ui/Avatar";
import { DeleteHalaqaButton } from "@/components/halaqat/DeleteHalaqaButton";

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
      teacher: {
        select: {
          name: true,
          avatarUrl: true,
          phone: true,
          nationality: true,
          nationalIdLastFour: true,
          age: true,
          educationLevel: true,
          residence: true,
          memorizedAmount: true,
        },
      },
      supervisor: { select: { name: true, avatarUrl: true, phone: true } },
      track: { select: { id: true, name: true } },
      students: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  if (!halaqa) notFound();

  const canManage =
    isAdminRole(user.role) ||
    (user.role === "SUPERVISOR" && halaqa.supervisorId === user.id) ||
    (user.role === "TEACHER" && halaqa.teacherId === user.id);

  if (
    user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id
  ) {
    // مشرفة تحاول الدخول لحلقة ليست تحت إشرافها
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-red-700 dark:text-red-400">
        لا تملكين صلاحية عرض هذه الحلقة
      </div>
    );
  }
  if (user.role === "TEACHER" && halaqa.teacherId !== user.id) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-red-700 dark:text-red-400">
        لا تملكين صلاحية عرض هذه الحلقة
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{halaqa.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {halaqa.time}
            {halaqa.track && (
              <>
                {" "}
                ·{" "}
                <Link href={`/tracks/${halaqa.track.id}`} className="text-brand hover:underline">
                  {halaqa.track.name}
                </Link>
              </>
            )}
          </p>
        </div>
        {canManage && (isAdminRole(user.role) || user.role === "SUPERVISOR") && (
          <div className="flex items-center gap-3">
            <Link
              href={`/halaqat/${halaqa.id}/edit`}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              تعديل الحلقة
            </Link>
            <DeleteHalaqaButton
              halaqaId={halaqa.id}
              name={halaqa.name}
              className="rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">بيانات المعلمة</h2>
          {halaqa.teacher ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={halaqa.teacher.name} avatarUrl={halaqa.teacher.avatarUrl} size={48} />
                <span className="font-medium text-slate-800 dark:text-slate-100">{halaqa.teacher.name}</span>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">

              <dt className="text-slate-400 dark:text-slate-500">رقم الجوال</dt>
              <dd dir="ltr" className="text-slate-700 dark:text-slate-200 text-right">
                {halaqa.teacher.phone ?? "—"}
              </dd>

              <dt className="text-slate-400 dark:text-slate-500">الجنسية</dt>
              <dd className="text-slate-700 dark:text-slate-200">{halaqa.teacher.nationality ?? "—"}</dd>

              <dt className="text-slate-400 dark:text-slate-500">رقم الهوية/الإقامة</dt>
              <dd>
                {isAdminRole(user.role) && halaqa.teacherId ? (
                  <RevealNationalId userId={halaqa.teacherId} lastFour={halaqa.teacher.nationalIdLastFour} />
                ) : (
                  <span dir="ltr" className="font-mono text-slate-400 dark:text-slate-500">
                    •••••{halaqa.teacher.nationalIdLastFour}
                  </span>
                )}
              </dd>

              <dt className="text-slate-400 dark:text-slate-500">العمر</dt>
              <dd className="text-slate-700 dark:text-slate-200">{halaqa.teacher.age ?? "—"}</dd>

              <dt className="text-slate-400 dark:text-slate-500">المؤهل الدراسي</dt>
              <dd className="text-slate-700 dark:text-slate-200">{halaqa.teacher.educationLevel ?? "—"}</dd>

              <dt className="text-slate-400 dark:text-slate-500">مقر الإقامة</dt>
              <dd className="text-slate-700 dark:text-slate-200">{halaqa.teacher.residence ?? "—"}</dd>

              <dt className="text-slate-400 dark:text-slate-500">مقدار الحفظ</dt>
              <dd className="text-slate-700 dark:text-slate-200">{halaqa.teacher.memorizedAmount ?? "—"}</dd>
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">لم يتم تعيين معلمة لهذه الحلقة بعد</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">بيانات المشرفة</h2>
          {halaqa.supervisor ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={halaqa.supervisor.name} avatarUrl={halaqa.supervisor.avatarUrl} size={48} />
                <span className="font-medium text-slate-800 dark:text-slate-100">{halaqa.supervisor.name}</span>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-400 dark:text-slate-500">رقم الجوال</dt>
                <dd dir="ltr" className="text-slate-700 dark:text-slate-200 text-right">
                  {halaqa.supervisor.phone ?? "—"}
                </dd>
              </dl>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">لم يتم تعيين مشرفة لهذه الحلقة بعد</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            طالبات الحلقة ({halaqa.students.length})
          </h2>
          <Link href="/students" className="text-sm text-brand font-medium hover:underline">
            إدارة الطالبات
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجنسية</th>
                <th className="px-5 py-3 font-medium">إجمالي الأوجه المحفوظة</th>
                <th className="px-5 py-3 font-medium">النصاب الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {halaqa.students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد طالبات مضافات بعد
                  </td>
                </tr>
              )}
              {halaqa.students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.nationality}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.memorizedPagesTotal}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.currentQuota ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
