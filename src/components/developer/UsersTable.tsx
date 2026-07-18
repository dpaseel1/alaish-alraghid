"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROLE_LABELS } from "@/components/layout/nav-items";
import { DeleteUserButton } from "@/components/developer/DeleteUserButton";
import { startImpersonationAction } from "@/app/actions/impersonate";
import { Avatar } from "@/components/ui/Avatar";

type UserRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: "DEVELOPER" | "ADMIN" | "SUPERVISOR" | "TEACHER";
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  phone: string | null;
  lastSeenAt: Date | string | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
  ACTIVE: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  SUSPENDED: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "بانتظار الموافقة",
  ACTIVE: "مفعّل",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};

export function UsersTable({ users, actorId }: { users: UserRow[]; actorId: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || ROLE_LABELS[u.role].includes(q)
    );
  }, [users, query]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
          جميع الحسابات ({filtered.length}/{users.length})
        </h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحثي بالاسم أو الصفة..."
          className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-right">
              <th className="px-5 py-3 font-medium">الاسم</th>
              <th className="px-5 py-3 font-medium">الصفة</th>
              <th className="px-5 py-3 font-medium">الحالة</th>
              <th className="px-5 py-3 font-medium">الجوال</th>
              <th className="px-5 py-3 font-medium">آخر ظهور</th>
              <th className="px-5 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                  لا توجد نتائج مطابقة
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const canImpersonate = u.id !== actorId && u.role !== "DEVELOPER" && u.status === "ACTIVE";
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} avatarUrl={u.avatarUrl} size={30} />
                      <span>
                        {u.name}
                        {u.id === actorId && <span className="text-xs text-brand mr-2">(أنتِ)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{ROLE_LABELS[u.role]}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[u.status]}`}
                    >
                      {STATUS_LABELS[u.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300" dir="ltr">
                    {u.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {u.lastSeenAt
                      ? new Date(u.lastSeenAt).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href={`/developer/${u.id}/edit`} className="text-xs text-brand hover:underline">
                        تعديل
                      </Link>
                      {canImpersonate && (
                        <form action={startImpersonationAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
                            title={`مشاهدة النظام كحساب "${u.name}"`}
                          >
                            تجربة الحساب
                          </button>
                        </form>
                      )}
                      {u.id !== actorId && <DeleteUserButton userId={u.id} name={u.name} />}
                    </div>
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
