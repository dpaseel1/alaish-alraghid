import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { CreateUserForm } from "@/components/developer/CreateUserForm";
import { UsersTable } from "@/components/developer/UsersTable";

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
          إدارة كاملة لجميع الحسابات في النظام، بما فيها حساب المديرة. يمكنك أيضًا الضغط على
          "تجربة الحساب" بجانب أي معلمة أو مشرفة أو المديرة لمشاهدة النظام تمامًا كما تراه هي
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إنشاء حساب جديد</h2>
        <CreateUserForm />
      </div>

      <UsersTable users={users} actorId={actor.id} />
    </div>
  );
}
