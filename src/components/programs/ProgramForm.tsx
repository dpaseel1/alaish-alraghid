"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ProgramActionState } from "@/app/actions/programs";

const initialState: ProgramActionState = {};

export function ProgramForm({
  action,
  defaultName,
  defaultDescription,
  defaultDuration,
  defaultAcademicYear,
  defaultReportFileName,
  defaultCoverImageUrl,
  cancelHref,
  submitLabel,
}: {
  action: (
    state: ProgramActionState | undefined,
    formData: FormData
  ) => Promise<ProgramActionState>;
  defaultName?: string;
  defaultDescription?: string | null;
  defaultDuration?: string;
  defaultAcademicYear?: string;
  defaultReportFileName?: string | null;
  defaultCoverImageUrl?: string | null;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          اسم البرنامج
        </label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={defaultName}
          placeholder="مثال: برنامج التحفيظ الصيفي"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          صورة تعريفية للبرنامج{" "}
          <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
        </label>
        <div className="flex items-center gap-4">
          {(preview ?? defaultCoverImageUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview ?? defaultCoverImageUrl ?? ""}
              alt="صورة البرنامج"
              className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand shrink-0 text-xs">
              بلا صورة
            </div>
          )}
          <input
            name="coverImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setPreview(null);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
            className="flex-1 text-sm text-slate-600 dark:text-slate-300 file:me-3 file:rounded-lg file:border-0 file:bg-brand-light dark:file:bg-brand-dark/30 file:text-brand-dark dark:file:text-brand file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-brand/20"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          وصف البرنامج{" "}
          <span className="text-slate-400 dark:text-slate-500 font-normal">(اختياري)</span>
        </label>
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          defaultValue={defaultDescription ?? ""}
          placeholder="نبذة مختصرة عن البرنامج وأهدافه"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            المدة
          </label>
          <input
            name="duration"
            required
            maxLength={50}
            defaultValue={defaultDuration}
            placeholder="مثال: 3 أشهر"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            العام الدراسي
          </label>
          <input
            name="academicYear"
            required
            maxLength={20}
            defaultValue={defaultAcademicYear}
            placeholder="مثال: 1447هـ"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          التقرير الختامي{" "}
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            (اختياري، PDF أو صورة)
          </span>
        </label>
        {defaultReportFileName && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            الملف الحالي: {defaultReportFileName}
          </p>
        )}
        <input
          name="report"
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="w-full text-sm text-slate-600 dark:text-slate-300 file:me-3 file:rounded-lg file:border-0 file:bg-brand-light dark:file:bg-brand-dark/30 file:text-brand-dark dark:file:text-brand file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-brand/20"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
        >
          {pending ? "جاري الحفظ..." : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-6 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
