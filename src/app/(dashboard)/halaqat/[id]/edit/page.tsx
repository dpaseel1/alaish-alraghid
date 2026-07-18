import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { updateHalaqaAction } from "@/app/actions/halaqat";
import { HalaqaForm } from "@/components/halaqat/HalaqaForm";

export default async function EditHalaqaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("ADMIN", "SUPERVISOR");

  const halaqa = await db.halaqa.findUnique({ where: { id } });
  if (!halaqa) notFound();
  if (user.role === "SUPERVISOR" && halaqa.supervisorId !== user.id) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        لا تملكين صلاحية تعديل هذه الحلقة
      </div>
    );
  }

  const [teachers, supervisors] = await Promise.all([
    db.user.findMany({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
        OR: [{ teacherHalaqa: null }, { teacherHalaqa: { id: halaqa.id } }],
      },
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

  const boundAction = updateHalaqaAction.bind(null, halaqa.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">تعديل الحلقة</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <HalaqaForm
          action={boundAction}
          teachers={teachers}
          supervisors={supervisors}
          isAdmin={user.role === "ADMIN"}
          initial={{
            name: halaqa.name,
            time: halaqa.time,
            teacherId: halaqa.teacherId,
            supervisorId: halaqa.supervisorId,
          }}
        />
      </div>
    </div>
  );
}
