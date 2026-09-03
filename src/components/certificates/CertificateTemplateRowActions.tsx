"use client";

import { useTransition } from "react";
import {
  activateCertificateTemplateAction,
  deleteCertificateTemplateAction,
} from "@/app/actions/certificateTemplates";

export function CertificateTemplateRowActions({
  templateId,
  name,
  isActive,
}: {
  templateId: string;
  name: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {!isActive && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`هل تودين تفعيل قالب "${name}"؟ سيحل محل القالب النشط الحالي في كل الشهادات الجديدة.`)) {
              startTransition(async () => {
                await activateCertificateTemplateAction(templateId);
              });
            }
          }}
          className="text-xs text-brand hover:underline disabled:opacity-50"
        >
          تفعيل
        </button>
      )}
      {isActive && (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">القالب النشط</span>
      )}
      {!isActive && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`هل أنتِ متأكدة من حذف قالب "${name}"؟ لا يمكن التراجع عن الحذف.`)) {
              startTransition(async () => {
                await deleteCertificateTemplateAction(templateId);
              });
            }
          }}
          className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          حذف
        </button>
      )}
    </div>
  );
}
