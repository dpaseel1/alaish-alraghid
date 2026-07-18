import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { updateProgramAction } from "@/app/actions/programs";
import { ProgramForm } from "@/components/programs/ProgramForm";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const program = await db.program.findUnique({ where: { id } });
  if (!program) notFound();

  const boundAction = updateProgramAction.bind(null, program.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">تعديل البرنامج</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تعديل بيانات برنامج "{program.name}"</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <ProgramForm
          action={boundAction}
          defaultName={program.name}
          defaultDuration={program.duration}
          defaultAcademicYear={program.academicYear}
          defaultReportFileName={program.reportFileName}
          cancelHref="/achievements"
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
