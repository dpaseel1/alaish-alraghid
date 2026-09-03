"use client";

import { useActionState } from "react";
import type { TrackActionState } from "@/app/actions/tracks";

const initialState: TrackActionState = {};

type SupervisorOption = {
  id: string;
  name: string;
  supervisedTrackId: string | null;
  supervisedTrack: { name: string } | null;
};

export function TrackSupervisorsForm({
  trackId,
  supervisors,
  action,
}: {
  trackId: string;
  supervisors: SupervisorOption[];
  action: (
    state: TrackActionState | undefined,
    formData: FormData
  ) => Promise<TrackActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-3">
          {state.success}
        </div>
      )}

      {supervisors.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          لا توجد حسابات مشرفات بعد — أنشئي حسابًا من صفحة المشرفات
        </p>
      ) : (
        <div className="space-y-2">
          {supervisors.map((s) => {
            const isOnOtherTrack = s.supervisedTrackId !== null && s.supervisedTrackId !== trackId;
            return (
              <label
                key={s.id}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <input
                  type="checkbox"
                  name="supervisorIds"
                  value={s.id}
                  defaultChecked={s.supervisedTrackId === trackId}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand focus:ring-brand"
                />
                <span className="text-slate-800 dark:text-slate-100 font-medium">{s.name}</span>
                {isOnOtherTrack && (
                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                    (حاليًا: {s.supervisedTrack?.name ?? "—"} — سيتم نقلها)
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || supervisors.length === 0}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الحفظ..." : "حفظ مشرفات المسار"}
      </button>
    </form>
  );
}
