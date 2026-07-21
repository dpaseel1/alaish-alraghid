"use client";

import { useState } from "react";

type TeacherProfileButtonProps = {
  name: string;
  nationality?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  residence?: string | null;
  memorizedAmount?: string | null;
  experience?: string | null;
  variant?: "link" | "solid";
};

const FIELD_LABELS: { key: keyof Omit<TeacherProfileButtonProps, "name">; label: string }[] = [
  { key: "nationality", label: "الجنسية" },
  { key: "age", label: "العمر" },
  { key: "educationLevel", label: "المؤهل الدراسي" },
  { key: "residence", label: "مقر الإقامة" },
  { key: "memorizedAmount", label: "مقدار الحفظ من القرآن الكريم" },
  { key: "experience", label: "الخبرة" },
];

export function TeacherProfileButton(props: TeacherProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const isSolid = props.variant === "solid";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          isSolid
            ? "rounded-lg bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand text-xs font-medium px-3 py-1.5 hover:bg-brand/20"
            : "block mt-1 text-xs text-brand hover:underline"
        }
      >
        عرض بيانات المعلمة
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                بيانات {props.name}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                إغلاق
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              {FIELD_LABELS.map(({ key, label }) => {
                const value = props[key];
                return (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className="text-slate-800 dark:text-slate-100 font-medium text-left">
                      {value === null || value === undefined || value === "" ? "—" : value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
