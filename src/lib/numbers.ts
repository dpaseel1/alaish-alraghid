const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** يحوّل أي أرقام عربية/فارسية داخل نص إلى أرقام إنجليزية (0-9) */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(digit);
    if (arabicIndex !== -1) return String(arabicIndex);
    const extendedIndex = EXTENDED_ARABIC_INDIC_DIGITS.indexOf(digit);
    return String(extendedIndex);
  });
}
