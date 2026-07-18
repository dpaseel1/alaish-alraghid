import { getCurrentUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-light via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 px-4 py-10 relative">
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt="شعار الموقع"
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white text-2xl font-bold shadow-lg">
              ق
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            العيش الرغيد
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            نظام إدارة حلقات تحفيظ القرآن الكريم
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
