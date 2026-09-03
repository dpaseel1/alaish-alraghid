export const HALAQA_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export type HalaqaDay = (typeof HALAQA_DAYS)[number];

export const HALAQA_DAY_LABELS: Record<HalaqaDay, string> = {
  SUN: "الأحد",
  MON: "الاثنين",
  TUE: "الثلاثاء",
  WED: "الأربعاء",
  THU: "الخميس",
  FRI: "الجمعة",
  SAT: "السبت",
};
