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

/** أيام الأسبوع الدراسي (الأحد إلى الخميس) بتوقيت الرياض، كمصفوفة من 5 تواريخ UTC-منتصف-ليل.
 *  weekOffset بالأسابيع نسبةً للأسبوع الحالي (0 = الحالي، -1 = الأسبوع الماضي، ...) لعرض/تعديل أسابيع سابقة */
export function riyadhWeekDays(weekOffset = 0): Date[] {
  return riyadhFullWeekDays(weekOffset).slice(0, 5);
}

/** كل أيام الأسبوع (الأحد إلى السبت) بتوقيت الرياض، كمصفوفة من 7 تواريخ UTC-منتصف-ليل. تُستخدم للحلقات التي تنعقد أيام الجمعة/السبت.
 *  weekOffset بالأسابيع نسبةً للأسبوع الحالي (0 = الحالي، -1 = الأسبوع الماضي، ...) */
export function riyadhFullWeekDays(weekOffset = 0): Date[] {
  const today = riyadhToday();
  const weekday = today.getUTCDay(); // الأحد = 0 ... السبت = 6
  const sunday = new Date(today);
  sunday.setUTCDate(sunday.getUTCDate() - weekday + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

/** بداية أسبوع (الأحد) بتوقيت الرياض، كتاريخ UTC-منتصف-ليل - يُستخدم كمفتاح تجميع أسبوعي (مثل خانة السرد).
 *  weekOffset بالأسابيع نسبةً للأسبوع الحالي (0 = الحالي، -1 = الأسبوع الماضي، ...) */
export function riyadhWeekStart(weekOffset = 0): Date {
  return riyadhFullWeekDays(weekOffset)[0];
}

/** حدود الشهر الهجري الحالي (بتوقيت الرياض) كتاريخين ميلاديين UTC-منتصف-ليل [بداية، نهاية-غير-شاملة]، مع اسم الشهر بالعربية - للحصر الشهري في تقارير الحفظ/المراجعة */
export function riyadhHijriMonthRange(): { start: Date; end: Date; monthLabel: string } {
  const hijriMonthYear = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: RIYADH_TZ,
      year: "numeric",
      month: "numeric",
    }).formatToParts(date);
    return {
      month: Number(parts.find((p) => p.type === "month")?.value),
      year: Number(parts.find((p) => p.type === "year")?.value),
    };
  };

  const today = riyadhToday();
  const { month, year } = hijriMonthYear(today);

  const start = new Date(today);
  while (true) {
    const prev = new Date(start);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const hy = hijriMonthYear(prev);
    if (hy.month !== month || hy.year !== year) break;
    start.setTime(prev.getTime());
  }

  const end = new Date(today);
  while (true) {
    const hy = hijriMonthYear(end);
    if (hy.month !== month || hy.year !== year) break;
    end.setUTCDate(end.getUTCDate() + 1);
  }

  const monthLabel = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    timeZone: RIYADH_TZ,
    month: "long",
  }).format(today);

  return { start, end, monthLabel };
}
