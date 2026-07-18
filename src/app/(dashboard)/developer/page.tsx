import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import { CreateUserForm } from "@/components/developer/CreateUserForm";
import { DeleteUserButton } from "@/components/developer/DeleteUserButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  ACTIVE: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  SUSPENDED: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار الموافقة",
  ACTIVE: "مفعّل",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};

export default async function DeveloperPage() {
  const actor = await requireRole("DEVELOPER");

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">لوحة المطورة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة كاملة لجميع الحسابات في النظام، بما فيها حساب المديرة
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إنشاء حساب جديد</h2>
        <CreateUserForm />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            جميع الحسابات ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الصفة</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">الجوال</th>
                <th className="px-5 py-3 font-medium">آخر ظهور</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {u.name}
                    {u.id === actor.id && (
                      <span className="text-xs text-brand mr-2">(أنتِ)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                    {ROLE_LABELS[u.role]}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[u.status]}`}
                    >
                      {STATUS_LABELS[u.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300" dir="ltr">
                    {u.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {u.lastSeenAt
                      ? new Date(u.lastSeenAt).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/developer/${u.id}/edit`}
                        className="text-xs text-brand hover:underline"
                      >
                        تعديل
                      </Link>
                      {u.id !== actor.id && <DeleteUserButton userId={u.id} name={u.name} />}
                    </div>
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
