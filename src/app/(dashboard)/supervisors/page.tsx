import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import {
  suspendSupervisorAction,
  reactivateSupervisorAction,
} from "@/app/actions/supervisors";
import { CreateSupervisorForm } from "@/components/supervisors/CreateSupervisorForm";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  ACTIVE: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  SUSPENDED: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار الموافقة",
  ACTIVE: "مفعّلة",
  REJECTED: "مرفوضة",
  SUSPENDED: "موقوفة",
};

export default async function SupervisorsPage() {
  await requireRole("ADMIN");

  const supervisors = await db.user.findMany({
    where: { role: "SUPERVISOR" },
    include: { supervisedHalaqat: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">المشرفات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة حسابات المشرفات وإنشاء حسابات جديدة
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إضافة مشرفة جديدة</h2>
        <CreateSupervisorForm />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">كل المشرفات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجوال</th>
                <th className="px-5 py-3 font-medium">عدد الحلقات المُشرَف عليها</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {supervisors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد مشرفات بعد
                  </td>
                </tr>
              )}
              {supervisors.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {s.supervisedHalaqat.length}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {s.status === "ACTIVE" && (
                      <form action={suspendSupervisorAction.bind(null, s.id)}>
                        <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline">
                          إيقاف الحساب
                        </button>
                      </form>
                    )}
                    {s.status === "SUSPENDED" && (
                      <form action={reactivateSupervisorAction.bind(null, s.id)}>
                        <button className="text-xs text-brand hover:underline">
                          إعادة التفعيل
                        </button>
                      </form>
                    )}
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
