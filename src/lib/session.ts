import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateSessionToken } from "@/lib/crypto";
import type { Role, User } from "@/generated/prisma/client";

const SESSION_COOKIE = "halaqat_session";
const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? 30);

/** كوكي "تجربة الحساب" - تُستخدم من المطورة فقط لمشاهدة النظام كأي حساب آخر */
const IMPERSONATE_COOKIE = "halaqat_impersonate";
const IMPERSONATE_DURATION_HOURS = 6;

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(IMPERSONATE_COOKIE);
}

/** يرجع المستخدم المسجّل فعليًا (صاحب الجلسة) بدون تطبيق أي "تجربة حساب" - آمن للاستخدام في أي مكان */
export async function getRawUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (session.user.status !== "ACTIVE") return null;

  // تحديث آخر ظهور (يُستخدم في إحصائية "المعلمات المتصلات حاليًا")
  db.user
    .update({
      where: { id: session.user.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  return session.user;
}

/**
 * يرجع المستخدم "الفعّال" الحالي: إذا كانت المطورة تُجرّب حسابًا آخر (عبر لوحة المطورة)
 * فسيُرجع حساب الهدف بدلًا من حساب المطورة، بحيث ترى بقية الصفحات والصلاحيات كأنها ذلك الحساب.
 * بدون أي إعادة توجيه - آمن للاستخدام في أي مكان.
 */
export async function getCurrentUser(): Promise<User | null> {
  const rawUser = await getRawUser();
  if (!rawUser) return null;
  if (rawUser.role !== "DEVELOPER") return rawUser;

  const cookieStore = await cookies();
  const targetId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!targetId) return rawUser;

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target || target.status !== "ACTIVE" || target.role === "DEVELOPER") {
    return rawUser;
  }

  return target;
}

/**
 * معلومات "تجربة الحساب" الحالية لعرضها في شريط التنبيه (اسم المطورة الحقيقي + الحساب المُجرَّب).
 * ترجع null إذا لم تكن هناك تجربة نشطة.
 */
export async function getImpersonationView(): Promise<{ realUser: User; targetUser: User } | null> {
  const rawUser = await getRawUser();
  if (!rawUser || rawUser.role !== "DEVELOPER") return null;

  const cookieStore = await cookies();
  const targetId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  if (!targetId) return null;

  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target || target.status !== "ACTIVE" || target.role === "DEVELOPER") return null;

  return { realUser: rawUser, targetUser: target };
}

/** تبدأ المطورة تجربة حساب آخر - يجب استدعاؤها من Server Action فقط */
export async function startImpersonation(targetUserId: string) {
  const rawUser = await getRawUser();
  if (!rawUser || rawUser.role !== "DEVELOPER") {
    throw new Error("لا تملكين صلاحية تجربة الحسابات");
  }
  if (targetUserId === rawUser.id) {
    throw new Error("لا يمكنك تجربة حسابك الخاص");
  }

  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("الحساب غير موجود");
  if (target.role === "DEVELOPER") throw new Error("لا يمكن تجربة حساب مطورة آخر");
  if (target.status !== "ACTIVE") throw new Error("لا يمكن تجربة حساب غير مفعّل");

  const cookieStore = await cookies();
  const expires = new Date();
  expires.setHours(expires.getHours() + IMPERSONATE_DURATION_HOURS);
  cookieStore.set(IMPERSONATE_COOKIE, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return target;
}

/** تنهي المطورة تجربة الحساب وتعود لحسابها الأصلي - يجب استدعاؤها من Server Action فقط */
export async function stopImpersonation() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
}

/** يتأكد من وجود مستخدم مسجّل دخول، وإلا يعيد التوجيه لصفحة الدخول */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** يتأكد من أن المستخدم الحالي يملك أحد الأدوار المطلوبة */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role) && user.role !== "DEVELOPER") redirect("/");
  return user;
}

/** المطورة تملك كل صلاحيات المديرة ضمنيًا (بالإضافة إلى لوحة المطور الخاصة بها) */
export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "DEVELOPER";
}
