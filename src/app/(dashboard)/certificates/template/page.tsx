import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { CertificateTemplateForm } from "@/components/certificates/CertificateTemplateForm";
import { CertificateTemplateRowActions } from "@/components/certificates/CertificateTemplateRowActions";

export default async function CertificateTemplatePage() {
  await requireRole("ADMIN");

  const templates = await db.certificateTemplate.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/certificates" className="text-sm text-brand hover:underline">
          ← الرجوع للأرشيف والشهادات
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">قوالب الشهادات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ارفعي قالبًا جديدًا كل ترم وحدّدي مواضع العناصر عليه، ثم فعّليه لاستخدامه في كل شهادات الطالبات
        </p>
      </div>

      <CertificateTemplateForm />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">القوالب المحفوظة ({templates.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">تاريخ الإنشاء</th>
                <th className="px-5 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {templates.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                    لا توجد قوالب مرفوعة بعد — الشهادات تُصدَّر حاليًا بالتصميم الافتراضي
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{t.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300" dir="ltr">
                    {t.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-5 py-3">
                    <CertificateTemplateRowActions templateId={t.id} name={t.name} isActive={t.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
