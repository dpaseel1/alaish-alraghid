import "server-only";
import { db } from "@/lib/db";

/** إعدادات الموقع العامة (صف وحيد). ترجع null إن لم يُخصَّص شعار بعد. */
export async function getSiteSettings() {
  return db.appSettings.findUnique({ where: { id: "main" } });
}
