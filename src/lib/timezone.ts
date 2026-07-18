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
