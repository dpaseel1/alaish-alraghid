import { requireUser } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} />
      <div className="md:mr-64 flex flex-col min-h-screen">
        <Topbar name={user.name} role={user.role} />
        <MobileNav role={user.role} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
