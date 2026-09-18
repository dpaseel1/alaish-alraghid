import type { DayCell } from "@/lib/supervisorDashboard";
import { HALAQA_DAYS, HALAQA_DAY_LABELS } from "@/lib/halaqaDays";

/** لا تستورد "server-only": يُستخدم هذا الملف من مكوّنات العميل (زر تصدير PDF) بالإضافة لمكوّنات الخادم */

export function dayLabelForIso(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00Z`);
  return HALAQA_DAY_LABELS[HALAQA_DAYS[d.getUTCDay()]];
}

/** نص خانة اليوم في الجدول: أيقونة غياب، أو "ح: X | م: Y | س: Z" حسب توفر البيانات، أو "—" إن لم تُدخَل بيانات بعد */
export function cellText(cell: DayCell, hideMemorized: boolean): string {
  if (cell.status === "ABSENT_EXCUSED") return "⭕";
  if (cell.status === "ABSENT_UNEXCUSED") return "❌";
  const parts: string[] = [];
  if (!hideMemorized && cell.pagesMemorized !== null) parts.push(`ح: ${cell.pagesMemorized}`);
  if (cell.pagesReviewed !== null) parts.push(`م: ${cell.pagesReviewed}`);
  if (cell.isNarrationDay && cell.sardPages !== null) parts.push(`س: ${cell.sardPages}`);
  return parts.length > 0 ? parts.join(" | ") : "—";
}
