"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="md:hidden sticky top-16 z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {item.icon} {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
