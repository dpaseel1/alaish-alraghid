import { requireRole, isAdminRole } from "@/lib/session";
import { db } from "@/lib/db";
import {
  approveTeacherAction,
  rejectTeacherAction,
  suspendTeacherAction,
  reactivateTeacherAction,
} from "@/app/actions/teachers";
import { RevealNationalId } from "@/components/teachers/RevealNationalId";
import { TeacherProfileButton } from "@/components/teachers/TeacherProfileButton";

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

export default async function TeachersPage() {
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const teachers = await db.user.findMany({
    where: {
      role: "TEACHER",
      ...(user.role === "SUPERVISOR"
        ? { teacherHalaqa: { supervisorId: user.id } }
        : {}),
    },
    include: { teacherHalaqa: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = teachers.filter((t) => t.status === "PENDING");
  const others = teachers.filter((t) => t.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">المعلمات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة حسابات المعلمات وموافقة التسجيلات الجديدة
        </p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-900/50">
            <h2 className="font-semibold text-amber-800">
              طلبات بانتظار الموافقة ({pending.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-right">
                  <th className="px-5 py-3 font-medium">الاسم</th>
                  <th className="px-5 py-3 font-medium">رقم الهوية/الإقامة</th>
                  <th className="px-5 py-3 font-medium">الجوال</th>
                  <th className="px-5 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {pending.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {t.name}
                    </td>
                    <td className="px-5 py-3">
                      {isAdminRole(user.role) ? (
                        <RevealNationalId userId={t.id} lastFour={t.nationalIdLastFour} />
                      ) : (
                        <span dir="ltr" className="font-mono text-slate-400 dark:text-slate-500">
                          •••••{t.nationalIdLastFour}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.phone ?? "—"}</td>
                    <td className="px-5 py-3 space-x-2 space-x-reverse">
                      <TeacherProfileButton
                        variant="solid"
                        name={t.name}
                        nationality={t.nationality}
                        age={t.age}
                        educationLevel={t.educationLevel}
                        residence={t.residence}
                        memorizedAmount={t.memorizedAmount}
                        experience={t.experience}
                      />
                      <form action={approveTeacherAction.bind(null, t.id)} className="inline">
                        <button className="rounded-lg bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-emerald-700">
                          موافقة
                        </button>
                      </form>
                      <form action={rejectTeacherAction.bind(null, t.id)} className="inline">
                        <button className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-medium px-3 py-1.5 hover:bg-red-100">
                          رفض
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">كل المعلمات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">رقم الهوية/الإقامة</th>
                <th className="px-5 py-3 font-medium">الحلقة</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {others.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد معلمات بعد
                  </td>
                </tr>
              )}
              {others.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{t.name}</td>
                  <td className="px-5 py-3">
                    {isAdminRole(user.role) ? (
                      <RevealNationalId userId={t.id} lastFour={t.nationalIdLastFour} />
                    ) : (
                      <span dir="ltr" className="font-mono text-slate-400 dark:text-slate-500">
                        •••••{t.nationalIdLastFour}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {t.teacherHalaqa?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                    <TeacherProfileButton
                      name={t.name}
                      nationality={t.nationality}
                      age={t.age}
                      educationLevel={t.educationLevel}
                      residence={t.residence}
                      memorizedAmount={t.memorizedAmount}
                      experience={t.experience}
                    />
                  </td>
                  <td className="px-5 py-3">
                    {t.status === "ACTIVE" && (
                      <form action={suspendTeacherAction.bind(null, t.id)}>
                        <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline">
                          إيقاف الحساب
                        </button>
                      </form>
                    )}
                    {t.status === "SUSPENDED" && (
                      <form action={reactivateTeacherAction.bind(null, t.id)}>
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
