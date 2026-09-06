export const STUDENT_IMPORT_FIELDS = [
  { key: "name", label: "الاسم", keywords: ["اسم"] },
  { key: "nationality", label: "الجنسية", keywords: ["جنسي"] },
  { key: "nationalId", label: "رقم الهوية/الإقامة", keywords: ["هوية"] },
  { key: "age", label: "العمر", keywords: ["عمر"] },
  { key: "educationLevel", label: "المؤهل الدراسي", keywords: ["مؤهل"] },
  { key: "residence", label: "مقر الإقامة", keywords: ["مقر"] },
  { key: "memorizedAmount", label: "مقدار الحفظ", keywords: ["حفظ"] },
] as const;

export type StudentImportFieldKey = (typeof STUDENT_IMPORT_FIELDS)[number]["key"];

// أعمدة يضيفها مايكروسوفت فورمز تلقائيًا لكل استبانة - تُستبعد من قائمة الاختيار لتسهيل العرض فقط
// (ليست ضرورية لصحة المطابقة، لكنها تُشوّش قائمة الأعمدة المعروضة على المستخدمة)
const KNOWN_METADATA_HEADERS = new Set([
  "Id",
  "وقت البدء",
  "وقت الإكمال",
  "البريد الإلكتروني",
  "إجمالي النقاط",
  "ملاحظات الاختبار",
  "تقييم وقت الترحيل",
]);

export function isSelectableHeader(header: string): boolean {
  const t = header.trim();
  if (!t) return false;
  if (KNOWN_METADATA_HEADERS.has(t)) return false;
  if (t.startsWith("النقاط - ") || t.startsWith("الملاحظات - ")) return false;
  return true;
}

/** يقترح لكل حقل رقم فهرس العمود الأنسب: أطول رأس عمود (غير مُستخدَم مسبقًا لحقل آخر) يحتوي إحدى كلماته المفتاحية */
export function suggestColumnMapping(headers: string[]): Record<StudentImportFieldKey, number | null> {
  const claimed = new Set<number>();
  const result = {} as Record<StudentImportFieldKey, number | null>;
  for (const field of STUDENT_IMPORT_FIELDS) {
    let bestIndex: number | null = null;
    let bestLength = -1;
    headers.forEach((h, i) => {
      if (claimed.has(i) || !isSelectableHeader(h)) return;
      const normalized = h.trim();
      if (field.keywords.some((k) => normalized.includes(k)) && normalized.length > bestLength) {
        bestIndex = i;
        bestLength = normalized.length;
      }
    });
    result[field.key] = bestIndex;
    if (bestIndex !== null) claimed.add(bestIndex);
  }
  return result;
}
