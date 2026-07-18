import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-light via-slate-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white text-2xl font-bold shadow-lg">
            ق
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            نظام إدارة حلقات التحفيظ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            منصة متابعة الحلقات والطالبات والمعلمات
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
