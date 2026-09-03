import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { updateTrackAction, updateTrackSupervisorsAction } from "@/app/actions/tracks";
import { TrackForm } from "@/components/tracks/TrackForm";
import { TrackSupervisorsForm } from "@/components/tracks/TrackSupervisorsForm";

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
  const boundSupervisorsAction = updateTrackSupervisorsAction.bind(null, track.id);

  const supervisors = await db.user.findMany({
    where: { role: "SUPERVISOR", status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      supervisedTrackId: true,
      supervisedTrack: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

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
          defaultImageUrl={track.imageUrl}
          cancelHref={`/tracks/${track.id}`}
          submitLabel="حفظ التعديلات"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">مشرفة المسار</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          حدّدي المشرفات المسؤولات عن هذا المسار — سيتمكّنّ من الاطلاع على حلقاته وتسجيل بياناته ورؤية سير المعلمات والطالبات
        </p>
        <TrackSupervisorsForm
          trackId={track.id}
          supervisors={supervisors}
          action={boundSupervisorsAction}
        />
      </div>
    </div>
  );
}
