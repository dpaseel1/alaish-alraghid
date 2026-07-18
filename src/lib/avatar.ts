import "server-only";

/** الحد الأقصى لحجم صورة الحساب (بعد الترميز) - نخزّنها كـ data URL داخل قاعدة البيانات مباشرة */
export const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // 1.5 ميجابايت
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * يحوّل ملف صورة مرفوع (من FormData) إلى data URL مُرمَّز base64 لتخزينه مباشرة في قاعدة البيانات.
 * يرجع كائنًا فارغًا إذا لم يُرفَع أي ملف (حتى لا نمسح الصورة الحالية بالخطأ)، أو رسالة خطأ عند عدم الصلاحية.
 */
export async function fileToAvatarDataUrl(
  file: FormDataEntryValue | null
): Promise<{ dataUrl?: string; error?: string }> {
  if (!file || typeof file === "string") return {};
  if (file.size === 0) return {};

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "صيغة الصورة غير مدعومة، يُسمح فقط بـ PNG أو JPG أو WEBP" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "حجم الصورة كبير جدًا (الحد الأقصى 1.5 ميجابايت)" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  return { dataUrl: `data:${file.type};base64,${base64}` };
}
