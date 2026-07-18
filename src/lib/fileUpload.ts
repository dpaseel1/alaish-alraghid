import "server-only";

/** الحد الأقصى لحجم ملف التقرير (بعد الترميز) - نخزّنه كـ data URL داخل قاعدة البيانات مباشرة */
export const MAX_REPORT_BYTES = 5 * 1024 * 1024; // 5 ميجابايت
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

/**
 * يحوّل ملف تقرير مرفوع (PDF أو صورة) إلى data URL مُرمَّز base64 لتخزينه مباشرة في قاعدة البيانات.
 * يرجع كائنًا فارغًا إذا لم يُرفَع أي ملف، أو رسالة خطأ عند عدم الصلاحية.
 */
export async function fileToReportDataUrl(
  file: FormDataEntryValue | null
): Promise<{ dataUrl?: string; fileName?: string; error?: string }> {
  if (!file || typeof file === "string") return {};
  if (file.size === 0) return {};

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "صيغة الملف غير مدعومة، يُسمح فقط بـ PDF أو PNG أو JPG أو WEBP" };
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { error: "حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  return { dataUrl: `data:${file.type};base64,${base64}`, fileName: file.name };
}
