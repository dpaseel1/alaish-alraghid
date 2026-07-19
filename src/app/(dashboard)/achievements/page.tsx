import Link from "next/link";
import { requireUser, isAdminRole } from "@/lib/session";
import { db } from "@/lib/db";
import { FileIcon, TrophyIcon } from "@/components/icons";
import { DeleteProgramButton } from "@/components/programs/DeleteProgramButton";

export default async function AchievementsPage() {
  const user = await requireUser();
  const isAdmin = isAdminRole(user.role);

  const programs = await db.program.findMany({ orderBy: { academicYear: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">سجل الإنجازات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            البرامج التي نفّذتها المقرأة وتقاريرها الختامية
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/achievements/new"
            className="rounded-lg bg-brand text-white font-medium px-4 py-2.5 hover:bg-brand-dark transition"
          >
            + إضافة برنامج
          </Link>
        )}
      </div>

      {programs.length === 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-400 dark:text-slate-500">
          لا توجد برامج مضافة بعد
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p) => (
          <div
            key={p.id}
            className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:border-brand transition p-6 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand">
                <TrophyIcon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{p.name}</h3>
            </div>

            {p.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 whitespace-pre-line">
                {p.description}
              </p>
            )}

            <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 mb-4">
              <p>المدة: {p.duration}</p>
              <p>العام الدراسي: {p.academicYear}</p>
            </div>

            {p.reportUrl && (
              <a
                href={p.reportUrl}
                download={p.reportFileName ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand font-medium px-4 py-2 text-sm hover:bg-brand/20 transition"
              >
                <FileIcon className="h-4 w-4" /> التقرير الختامي
              </a>
            )}

            {isAdmin && (
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <Link
                  href={`/achievements/${p.id}/edit`}
                  className="text-xs text-slate-400 hover:text-brand hover:underline"
                >
                  تعديل
                </Link>
                <DeleteProgramButton
                  programId={p.id}
                  name={p.name}
                  className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
