"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:right-0 border-l border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white font-bold">
          ق
        </div>
        <span className="font-semibold text-slate-800">حلقات التحفيظ</span>
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
                  ? "bg-brand-light text-brand-dark"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
