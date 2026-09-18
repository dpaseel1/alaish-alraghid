"use client";

import { useActionState, useState } from "react";
import { adminUpdateTeacherProfileAction, type TeacherActionState } from "@/app/actions/teachers";

type TeacherProfileButtonProps = {
  name: string;
  nationality?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  residence?: string | null;
  memorizedAmount?: string | null;
  experience?: string | null;
  variant?: "link" | "solid";
  /** يعرض زر "تعديل" ونموذج تعديل بدل العرض للقراءة فقط - للمديرة فقط */
  editable?: boolean;
  userId?: string;
  phone?: string | null;
};

const FIELD_LABELS: {
  key: keyof Omit<TeacherProfileButtonProps, "name" | "variant" | "editable" | "userId" | "phone">;
  label: string;
}[] = [
  { key: "nationality", label: "الجنسية" },
  { key: "age", label: "العمر" },
  { key: "educationLevel", label: "المؤهل الدراسي" },
  { key: "residence", label: "مقر الإقامة" },
  { key: "memorizedAmount", label: "مقدار الحفظ من القرآن الكريم" },
  { key: "experience", label: "الخبرة" },
];

const initialState: TeacherActionState = {};

export function TeacherProfileButton(props: TeacherProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isSolid = props.variant === "solid";
  const [state, formAction, pending] = useActionState(
    adminUpdateTeacherProfileAction.bind(null, props.userId ?? ""),
    initialState
  );

  const [handledSuccess, setHandledSuccess] = useState(state?.success);
  if (state?.success !== handledSuccess) {
    setHandledSuccess(state?.success);
    if (state?.success) setIsEditing(false);
  }

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
          onClick={() => {
            setOpen(false);
            setIsEditing(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                بيانات {props.name}
              </h3>
              <div className="flex items-center gap-3">
                {props.editable && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-brand hover:underline"
                  >
                    تعديل
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setIsEditing(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {isEditing ? (
              <form action={formAction} className="space-y-3 text-sm">
                {state?.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs px-3 py-2">
                    {state.error}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الاسم</label>
                  <input
                    name="name"
                    required
                    minLength={3}
                    maxLength={100}
                    defaultValue={props.name}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الجوال</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={props.phone ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الجنسية</label>
                  <input
                    name="nationality"
                    required
                    defaultValue={props.nationality ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">العمر</label>
                  <input
                    name="age"
                    type="number"
                    min={5}
                    max={100}
                    dir="ltr"
                    required
                    defaultValue={props.age ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">المؤهل الدراسي</label>
                  <input
                    name="educationLevel"
                    required
                    defaultValue={props.educationLevel ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">مقر الإقامة</label>
                  <input
                    name="residence"
                    required
                    defaultValue={props.residence ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    مقدار الحفظ من القرآن الكريم
                  </label>
                  <input
                    name="memorizedAmount"
                    required
                    defaultValue={props.memorizedAmount ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الخبرة</label>
                  <input
                    name="experience"
                    required
                    defaultValue={props.experience ?? ""}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark disabled:opacity-60"
                  >
                    {pending ? "جاري الحفظ..." : "حفظ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
