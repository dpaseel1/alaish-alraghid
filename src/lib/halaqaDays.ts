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

/**
 * تستنتج "يوم السرد" لعرضه في التقارير فقط: آخر يوم من أيام انعقاد الحلقة ضمن ترتيب الأسبوع (الأحد←السبت)،
 * أو الخميس افتراضيًا إن لم تُحدَّد أيام. لا علاقة لهذا الاستنتاج بآلية "سردت" الفعلية (خانة أسبوعية مستقلة).
 */
export function inferNarrationDay(days: string[]): HalaqaDay {
  const scheduled = (days.length > 0 ? days : DEFAULT_HALAQA_DAYS) as HalaqaDay[];
  return scheduled.reduce((last, d) => (HALAQA_DAYS.indexOf(d) > HALAQA_DAYS.indexOf(last) ? d : last));
}
