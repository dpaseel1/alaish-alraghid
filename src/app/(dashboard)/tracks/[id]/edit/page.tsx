import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { updateTrackAction } from "@/app/actions/tracks";
import { TrackForm } from "@/components/tracks/TrackForm";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const track = await db.track.findUnique({ where: { id } });
  if (!track) notFound();

  const boundAction = updateTrackAction.bind(null, track.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">تعديل المسار</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تعديل اسم المسار "{track.name}"</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <TrackForm
          action={boundAction}
          defaultName={track.name}
          cancelHref={`/tracks/${track.id}`}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </div>
  );
}
