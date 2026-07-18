import type { Role } from "@/generated/prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: "🏠", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/developer", label: "لوحة المطورة", icon: "🛠️", roles: ["DEVELOPER"] },
  { href: "/teachers", label: "المعلمات", icon: "👩‍🏫", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR"] },
  { href: "/supervisors", label: "المشرفات", icon: "🧭", roles: ["DEVELOPER", "ADMIN"] },
  { href: "/students", label: "الطالبات", icon: "📚", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/halaqat", label: "الحلقات", icon: "🕌", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/reports", label: "التقارير والإحصائيات", icon: "📊", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR"] },
  { href: "/honor-board", label: "لوحة الشرف", icon: "🏆", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/certificates", label: "الأرشيف والشهادات", icon: "📜", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/audit-log", label: "سجل الحركات", icon: "🗂️", roles: ["DEVELOPER", "ADMIN"] },
  { href: "/settings", label: "الإعدادات", icon: "⚙️", roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
];

export const ROLE_LABELS: Record<Role, string> = {
  DEVELOPER: "مطورة",
  ADMIN: "مديرة",
  SUPERVISOR: "مشرفة",
  TEACHER: "معلمة",
};
