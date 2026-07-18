import { requireUser, isAdminRole } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { UpdateProfileForm } from "@/components/settings/UpdateProfileForm";
import { UpdateLogoForm } from "@/components/settings/UpdateLogoForm";

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = isAdminRole(user.role);
  const settings = isAdmin ? await getSiteSettings() : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">الإعدادات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إدارة بيانات حسابك</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">بيانات الحساب</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          <span className="text-slate-400 dark:text-slate-500">الصفة: </span>
          {ROLE_LABELS[user.role]}
        </p>
        <UpdateProfileForm
          name={user.name}
          phone={user.phone}
          avatarUrl={user.avatarUrl}
          isTeacher={user.role === "TEACHER"}
          nationality={user.nationality}
          age={user.age}
          educationLevel={user.educationLevel}
          residence={user.residence}
          memorizedAmount={user.memorizedAmount}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">تغيير كلمة المرور</h2>
        <ChangePasswordForm />
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">شعار الموقع</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            يظهر هذا الشعار في القائمة الجانبية وأعلى الجوال وصفحة تسجيل الدخول
          </p>
          <UpdateLogoForm logoUrl={settings?.logoUrl} />
        </div>
      )}
    </div>
  );
}
