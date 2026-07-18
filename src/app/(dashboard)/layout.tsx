import { requireUser } from "@/lib/session";
import { getSiteSettings } from "@/lib/settings";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} logoUrl={settings?.logoUrl} />
      <div className="md:mr-64 flex flex-col min-h-screen">
        <Topbar
          name={user.name}
          role={user.role}
          avatarUrl={user.avatarUrl}
          logoUrl={settings?.logoUrl}
        />
        <ImpersonationBanner />
        <MobileNav role={user.role} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
