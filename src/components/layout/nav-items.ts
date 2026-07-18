import type { Role } from "@/generated/prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: "🏠", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/teachers", label: "المعلمات", icon: "👩‍🏫", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/supervisors", label: "المشرفات", icon: "🧭", roles: ["ADMIN"] },
  { href: "/students", label: "الطالبات", icon: "📚", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/halaqat", label: "الحلقات", icon: "🕌", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/reports", label: "التقارير والإحصائيات", icon: "📊", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/honor-board", label: "لوحة الشرف", icon: "🏆", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/certificates", label: "الأرشيف والشهادات", icon: "📜", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/audit-log", label: "سجل الحركات", icon: "🗂️", roles: ["ADMIN"] },
  { href: "/settings", label: "الإعدادات", icon: "⚙️", roles: ["ADMIN", "SUPERVISOR", "TEACHER"] },
];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "مديرة",
  SUPERVISOR: "مشرفة",
  TEACHER: "معلمة",
};
