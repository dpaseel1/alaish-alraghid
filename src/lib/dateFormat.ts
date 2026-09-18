const RIYADH_TZ = "Asia/Riyadh";
const RIYADH_LOCALE = "ar-SA-u-ca-islamic-umalqura-nu-latn";

/** تنسيق تاريخ فقط (هجري، أرقام إنجليزية) بتوقيت الرياض */
export function formatRiyadhDate(date: Date | string): string {
  return new Intl.DateTimeFormat(RIYADH_LOCALE, {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/** تنسيق تاريخ ووقت (هجري، أرقام إنجليزية) بتوقيت الرياض */
export function formatRiyadhDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(RIYADH_LOCALE, {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}
