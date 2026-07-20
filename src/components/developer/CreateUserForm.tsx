"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  createUserByDeveloperAction,
  type DeveloperActionState,
} from "@/app/actions/developer";
import { Avatar } from "@/components/ui/Avatar";

const initialState: DeveloperActionState = {};

const ROLE_OPTIONS = [
  { value: "TEACHER", label: "معلمة" },
  { value: "SUPERVISOR", label: "مشرفة" },
  { value: "ADMIN", label: "مديرة" },
  { value: "DEVELOPER", label: "مطورة" },
];

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserByDeveloperAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("TEACHER");
  const needsProfile = role === "TEACHER" || role === "SUPERVISOR";

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setPreview(null);
      setName("");
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-lg">
      {state?.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-sm px-4 py-3">
          {state.success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          الاسم الكامل
        </label>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          الصورة الشخصية (اختياري)
        </label>
        <div className="flex items-center gap-4">
          <Avatar name={name || "؟"} avatarUrl={preview} size={48} />
          <input
            name="avatar"
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
          الصفة
        </label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الهوية/الإقامة
        </label>
        <input
          name="nationalId"
          required
          dir="ltr"
          inputMode="numeric"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="1XXXXXXXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          رقم الجوال (اختياري)
        </label>
        <input
          name="phone"
          type="tel"
          dir="ltr"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="05xxxxxxxx"
        />
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          بيانات إضافية{" "}
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            {needsProfile ? "(مطلوبة للمعلمة/المشرفة)" : "(غير مطلوبة لهذه الصفة)"}
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">الجنسية</label>
            <input name="nationality" type="text" required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">العمر</label>
            <input name="age" type="number" min={5} max={100} dir="ltr" required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">المؤهل الدراسي</label>
            <input name="educationLevel" type="text" required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">مقر الإقامة</label>
            <input name="residence" type="text" required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">مقدار الحفظ من القرآن الكريم</label>
          <input name="memorizedAmount" type="text" placeholder="مثال: حافظة كاملة / 15 جزءًا" required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">الخبرة</label>
          <textarea name="experience" rows={2} required={needsProfile} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          كلمة مرور مبدئية
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="8 أحرف على الأقل"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
      >
        {pending ? "جاري الإنشاء..." : "إنشاء الحساب"}
      </button>
    </form>
  );
}
