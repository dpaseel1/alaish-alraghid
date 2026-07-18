import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGO = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY غير موجود أو غير صالح في متغيرات البيئة (يجب أن يكون 64 حرف hex)"
    );
  }
  return Buffer.from(key, "hex");
}

/** تجزئة رقم الهوية/الإقامة (باتجاه واحد) - تُستخدم لتسجيل الدخول والتأكد من عدم التكرار */
export function hashNationalId(nationalId: string): string {
  return crypto.createHash("sha256").update(nationalId.trim()).digest("hex");
}

/** آخر 4 أرقام من رقم الهوية/الإقامة تُعرض في الواجهات بدون فك تشفير */
export function lastFourOf(nationalId: string): string {
  const trimmed = nationalId.trim();
  return trimmed.slice(-4);
}

/** تشفير رقم الهوية/الإقامة بشكل قابل للاسترجاع - تراه المديرة فقط عند الحاجة */
export function encryptNationalId(nationalId: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(nationalId.trim(), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // نخزن iv + authTag + النص المشفر معًا بترميز base64
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** فك تشفير رقم الهوية/الإقامة - يُستخدم فقط من صفحات المديرة */
export function decryptNationalId(payload: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
