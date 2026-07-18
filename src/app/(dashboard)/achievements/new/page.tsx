import { requireRole } from "@/lib/session";
import { createProgramAction } from "@/app/actions/programs";
import { ProgramForm } from "@/components/programs/ProgramForm";

export default async function NewProgramPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">إضافة برنامج جديد</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          أضيفي برنامجًا جديدًا إلى سجل الإنجازات
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <ProgramForm action={createProgramAction} cancelHref="/achievements" submitLabel="إنشاء البرنامج" />
      </div>
    </div>
  );
}
