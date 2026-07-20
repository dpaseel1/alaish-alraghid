import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { decryptNationalId } from "@/lib/crypto";
import { UpdateUserForm } from "@/components/developer/UpdateUserForm";

export default async function DeveloperEditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("DEVELOPER");
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const nationalId = decryptNationalId(user.nationalIdEncrypted);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          تعديل حساب: {user.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          تعديل البيانات الكاملة للحساب، بما فيها رقم الهوية/الإقامة والصفة وكلمة المرور
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <UpdateUserForm
          userId={user.id}
          name={user.name}
          avatarUrl={user.avatarUrl}
          nationalId={nationalId}
          phone={user.phone}
          role={user.role}
          status={user.status}
          nationality={user.nationality}
          age={user.age}
          educationLevel={user.educationLevel}
          residence={user.residence}
          memorizedAmount={user.memorizedAmount}
          experience={user.experience}
        />
      </div>
    </div>
  );
}
