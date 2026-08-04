import { db } from "@/lib/db";
import { getCurrentSessionToken } from "@/lib/session";
import { revokeSessionAction, revokeOtherSessionsAction } from "@/app/actions/sessions";
import { ShieldIcon } from "@/components/icons";

function describeDevice(userAgent: string | null) {
  if (!userAgent) return "جهاز غير معروف";
  const ua = userAgent.toLowerCase();

  let os = "";
  if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux")) os = "Linux";

  let browser = "";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox/")) browser = "Firefox";

  return [browser, os].filter(Boolean).join(" · ") || "متصفح غير معروف";
}

export async function SessionsCard({ userId }: { userId: string }) {
  const [sessions, currentToken] = await Promise.all([
    db.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
    }),
    getCurrentSessionToken(),
  ]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-brand-dark dark:text-brand" />
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">الجلسات النشطة</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              الأجهزة المسجّلة دخولها حاليًا بحسابك
            </p>
          </div>
        </div>
        {sessions.length > 1 && (
          <form action={revokeOtherSessionsAction}>
            <button
              type="submit"
              className="rounded-lg border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              تسجيل الخروج من الأجهزة الأخرى
            </button>
          </form>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
              <th className="px-4 py-2 font-medium">الجهاز</th>
              <th className="px-4 py-2 font-medium">آخر نشاط</th>
              <th className="px-4 py-2 font-medium">تاريخ الدخول</th>
              <th className="px-4 py-2 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  لا توجد جلسات نشطة
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const isCurrent = s.token === currentToken;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {describeDevice(s.userAgent)}
                    {isCurrent && (
                      <span className="mr-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] px-2 py-0.5">
                        الجلسة الحالية
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                    {(s.lastActiveAt ?? s.createdAt).toLocaleString("ar-SA")}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                    {s.createdAt.toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-4 py-2">
                    {!isCurrent && (
                      <form action={revokeSessionAction.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="text-red-600 dark:text-red-400 hover:underline text-xs font-medium"
                        >
                          إنهاء الجلسة
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
