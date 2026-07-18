"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ role, logoUrl }: { role: Role; logoUrl?: string | null }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:right-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="شعار الموقع" className="h-9 w-9 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-bold shrink-0">
            ق
          </div>
        )}
        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
          العيش الرغيد
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-light dark:bg-brand-dark/30 text-brand-dark dark:text-brand"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
