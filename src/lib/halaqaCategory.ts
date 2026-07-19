import type { HalaqaCategory } from "@/generated/prisma/client";

export const HALAQA_CATEGORIES: HalaqaCategory[] = ["MOTHERS", "GIRLS", "CHILDREN"];

export const HALAQA_CATEGORY_LABELS: Record<HalaqaCategory, string> = {
  MOTHERS: "أمهات",
  GIRLS: "فتيات",
  CHILDREN: "أطفال",
};
