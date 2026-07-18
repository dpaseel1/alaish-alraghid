import { requireUser } from "@/lib/session";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">الإعدادات</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة بيانات حسابك</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-1">
        <h2 className="font-semibold text-slate-800 mb-3">بيانات الحساب</h2>
        <p className="text-sm text-slate-600">
          <span className="text-slate-400">الاسم: </span>
          {user.name}
        </p>
        <p className="text-sm text-slate-600">
          <span className="text-slate-400">الصفة: </span>
          {ROLE_LABELS[user.role]}
        </p>
        {user.phone && (
          <p className="text-sm text-slate-600">
            <span className="text-slate-400">الجوال: </span>
            {user.phone}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">تغيير كلمة المرور</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
