import "server-only";

const RIYADH_TZ = "Asia/Riyadh";

/** بداية اليوم الحالي بتوقيت الرياض (ميلادي)، كتاريخ UTC صالح للمقارنة/التخزين في القاعدة */
export function riyadhToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

/** أيام الأسبوع الدراسي الحالي (الأحد إلى الخميس) بتوقيت الرياض، كمصفوفة من 5 تواريخ UTC-منتصف-ليل */
export function riyadhWeekDays(): Date[] {
  const today = riyadhToday();
  const weekday = today.getUTCDay(); // الأحد = 0 ... السبت = 6
  const sunday = new Date(today);
  sunday.setUTCDate(sunday.getUTCDate() - weekday);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(sunday);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}
