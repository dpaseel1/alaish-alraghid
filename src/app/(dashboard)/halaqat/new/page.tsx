import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { createHalaqaAction } from "@/app/actions/halaqat";
import { HalaqaForm } from "@/components/halaqat/HalaqaForm";

export default async function NewHalaqaPage() {
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const [teachers, supervisors] = await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER", status: "ACTIVE", teacherHalaqa: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    user.role === "ADMIN"
      ? db.user.findMany({
          where: { role: "SUPERVISOR", status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">إضافة حلقة جديدة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          أنشئي الحلقة واربطيها بالمعلمة المسؤولة
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <HalaqaForm
          action={createHalaqaAction}
          teachers={teachers}
          supervisors={supervisors}
          isAdmin={user.role === "ADMIN"}
        />
      </div>
    </div>
  );
}
