import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateSessionToken } from "@/lib/crypto";
import type { Role, User } from "@/generated/prisma/client";

const SESSION_COOKIE = "halaqat_session";
const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? 30);

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
}

/** يرجع المستخدم الحالي أو null بدون أي إعادة توجيه - آمن للاستخدام في أي مكان */
export async function getCurrentUser(): Promise<User | null> {
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

/** يتأكد من وجود مستخدم مسجّل دخول، وإلا يعيد التوجيه لصفحة الدخول */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** يتأكد من أن المستخدم الحالي يملك أحد الأدوار المطلوبة */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
