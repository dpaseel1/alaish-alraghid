import type { Role } from "@/generated/prisma/client";
import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  ToolIcon,
  TeacherIcon,
  CompassIcon,
  BookIcon,
  MosqueIcon,
  ChartIcon,
  AwardIcon,
  ArchiveIcon,
  TrophyIcon,
  LogIcon,
  SettingsIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: HomeIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/developer", label: "لوحة المطورة", icon: ToolIcon, roles: ["DEVELOPER"] },
  { href: "/teachers", label: "المعلمات", icon: TeacherIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR"] },
  { href: "/supervisors", label: "المشرفات", icon: CompassIcon, roles: ["DEVELOPER", "ADMIN"] },
  { href: "/students", label: "الطالبات", icon: BookIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/halaqat", label: "الحلقات", icon: MosqueIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/reports", label: "التقارير والإحصائيات", icon: ChartIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR"] },
  { href: "/honor-board", label: "لوحة الشرف", icon: AwardIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/certificates", label: "الأرشيف والشهادات", icon: ArchiveIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/achievements", label: "سجل الإنجازات", icon: TrophyIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
  { href: "/audit-log", label: "سجل الحركات", icon: LogIcon, roles: ["DEVELOPER", "ADMIN"] },
  { href: "/settings", label: "الإعدادات", icon: SettingsIcon, roles: ["DEVELOPER", "ADMIN", "SUPERVISOR", "TEACHER"] },
];

export const ROLE_LABELS: Record<Role, string> = {
  DEVELOPER: "مطورة",
  ADMIN: "مديرة",
  SUPERVISOR: "مشرفة",
  TEACHER: "معلمة",
};
