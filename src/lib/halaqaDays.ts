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

/** الأيام الافتراضية لحلقة بلا أيام محددة (الأحد-الخميس)، نفس الافتراض المستخدم في التحضير الأسبوعي والسرد */
export const DEFAULT_HALAQA_DAYS: HalaqaDay[] = ["SUN", "MON", "TUE", "WED", "THU"];

/** يوم السرد ثابت لكل الحلقات: الخميس */
export const NARRATION_DAY: HalaqaDay = "THU";
