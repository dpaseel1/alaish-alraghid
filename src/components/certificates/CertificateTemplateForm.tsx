"use client";

import { useActionState, useState } from "react";
import { createCertificateTemplateAction, type CertificateTemplateActionState } from "@/app/actions/certificateTemplates";
import { DEFAULT_CERTIFICATE_LAYOUT, type CertificateLayout, type ImageBox } from "@/lib/certificateRender";
import { TemplateEditorCanvas } from "./TemplateEditorCanvas";

const IMAGE_LABELS: Record<keyof CertificateLayout["images"], string> = {
  logoJamiyah: "شعار الجمعية",
  logoAlaish: "شعار العيش الرغيد",
  stamp: "الختم",
  title: "عنوان شكر وتقدير",
};

const TEXT_LABELS: Record<keyof CertificateLayout["texts"], string> = {
  intro: "جملة التهنئة",
  name: "اسم الطالبة",
  quota: "النصاب",
  onCompletion: "على إتمامها حفظ",
  tier: "التقدير",
  percent: "النسبة المئوية",
  gradeLabel: "وحصولها على تقدير...بنسبة",
  dua: "الدعاء",
  signature: "التوقيع",
};

const initialState: CertificateTemplateActionState = {};

function cloneLayout(layout: CertificateLayout): CertificateLayout {
  return {
    images: Object.fromEntries(Object.entries(layout.images).map(([k, v]) => [k, { ...v }])) as CertificateLayout["images"],
    texts: Object.fromEntries(Object.entries(layout.texts).map(([k, v]) => [k, { ...v }])) as CertificateLayout["texts"],
  };
}

export function CertificateTemplateForm() {
  const [state, formAction, isPending] = useActionState(createCertificateTemplateAction, initialState);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [layout, setLayout] = useState<CertificateLayout>(() => cloneLayout(DEFAULT_CERTIFICATE_LAYOUT));

  function handleBackgroundChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setBackgroundPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBackgroundPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function updateImageBox(key: keyof CertificateLayout["images"], field: keyof ImageBox, value: number) {
    setLayout((prev) => ({
      ...prev,
      images: { ...prev.images, [key]: { ...prev.images[key], [field]: value } },
    }));
  }

  function updateTextBox(key: keyof CertificateLayout["texts"], field: "x" | "y" | "w" | "fontSize", value: number) {
    setLayout((prev) => ({
      ...prev,
      texts: { ...prev.texts, [key]: { ...prev.texts[key], [field]: value } },
    }));
  }

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم القالب</label>
            <input
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="مثال: قالب الفصل الأول 1448"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">صورة الخلفية</label>
            <input
              name="background"
              type="file"
              required
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBackgroundChange}
              className="w-full text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">PNG أو JPEG أو WEBP، بحد أقصى 1.5MB</p>
          </div>
        </div>

        <details className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
            مواضع الصور
          </summary>
          <div className="px-6 pb-6 space-y-4">
            {(Object.keys(layout.images) as (keyof CertificateLayout["images"])[]).map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{IMAGE_LABELS[key]}</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["x", "y", "w", "h"] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-slate-400 mb-0.5">{field}</label>
                      <input
                        type="number"
                        step="0.01"
                        name={`img${field.toUpperCase()}_${key}`}
                        value={layout.images[key][field]}
                        onChange={(e) => updateImageBox(key, field, Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>

        <details className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" open>
          <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
            مواضع النصوص
          </summary>
          <div className="px-6 pb-6 space-y-4">
            {(Object.keys(layout.texts) as (keyof CertificateLayout["texts"])[]).map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{TEXT_LABELS[key]}</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["x", "y", "w"] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-slate-400 mb-0.5">{field}</label>
                      <input
                        type="number"
                        step="0.01"
                        name={`txt${field.toUpperCase()}_${key}`}
                        value={layout.texts[key][field]}
                        onChange={(e) => updateTextBox(key, field, Number(e.target.value))}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-slate-400 mb-0.5">حجم الخط</label>
                    <input
                      type="number"
                      step="0.01"
                      name={`txtFontSize_${key}`}
                      value={layout.texts[key].fontSize}
                      onChange={(e) => updateTextBox(key, "fontSize", Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>

        {state.error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-4 py-2">
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-brand text-white py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "جارٍ الحفظ..." : "حفظ القالب"}
        </button>
      </div>

      <div className="lg:sticky lg:top-6 self-start space-y-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">معاينة حيّة</p>
        <TemplateEditorCanvas backgroundUrl={backgroundPreview} layout={layout} />
      </div>
    </form>
  );
}
