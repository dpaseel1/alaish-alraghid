"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateLogoAction,
  removeLogoAction,
  type SettingsActionState,
} from "@/app/actions/settings";

const initialState: SettingsActionState = {};

function LogoPreview({ src }: { src: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="شعار الموقع"
        className="h-14 w-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand font-bold text-xl">
      ق
    </div>
  );
}

export function UpdateLogoForm({ logoUrl }: { logoUrl?: string | null }) {
  const [state, formAction, pending] = useActionState(updateLogoAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, startRemoveTransition] = useTransition();

  return (
    <div className="space-y-4 max-w-md">
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

      <form action={formAction} className="space-y-4">
        <div className="flex items-center gap-4">
          <LogoPreview src={preview ?? logoUrl ?? null} />
          <div className="flex-1">
            <input
              name="logo"
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
              className="w-full text-sm text-slate-600 dark:text-slate-300 file:me-3 file:rounded-lg file:border-0 file:bg-brand-light dark:file:bg-brand-dark/30 file:text-brand-dark dark:file:text-brand file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-brand/20"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              PNG أو JPG أو WEBP، بحد أقصى 1.5 ميجابايت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand text-white font-medium px-6 py-2.5 hover:bg-brand-dark transition disabled:opacity-60"
          >
            {pending ? "جاري الحفظ..." : "حفظ الشعار"}
          </button>

          {logoUrl && (
            <button
              type="button"
              disabled={removing}
              onClick={() => {
                if (confirm("هل أنتِ متأكدة من إزالة شعار الموقع والرجوع للشعار الافتراضي؟")) {
                  startRemoveTransition(() => {
                    removeLogoAction();
                  });
                }
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
            >
              {removing ? "جاري الإزالة..." : "إزالة الشعار"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
