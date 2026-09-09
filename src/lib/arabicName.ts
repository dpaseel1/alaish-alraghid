/** يوحّد رسم الاسم العربي (تشكيل، ألف/همزة، تاء مربوطة، مسافات) لمطابقة أدق بين أسماء الملف وأسماء الطالبات المسجّلة */
export function normalizeArabicName(value: string): string {
  const ARABIC_DIACRITICS = /[ً-ٰٟ]/g;
  const ALEF_VARIANTS = /[آأإا]/g; // آ أ إ ا
  const ALEF_MAQSURA = /ى/g; // ى
  const TAA_MARBUTA = /ة/g; // ة

  return value
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ALEF_VARIANTS, "ا") // -> ا
    .replace(ALEF_MAQSURA, "ي") // -> ي
    .replace(TAA_MARBUTA, "ه") // -> ه
    .replace(/\s+/g, " ")
    .trim();
}
