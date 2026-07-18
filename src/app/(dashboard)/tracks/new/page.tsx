import { requireRole } from "@/lib/session";
import { createTrackAction } from "@/app/actions/tracks";
import { TrackForm } from "@/components/tracks/TrackForm";

export default async function NewTrackPage() {
  await requireRole("ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">إضافة مسار جديد</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          أنشئي مسارًا جديدًا (حاليًا أو قادمًا) لتجميع الحلقات تحته
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <TrackForm action={createTrackAction} cancelHref="/" submitLabel="إنشاء المسار" />
      </div>
    </div>
  );
}
