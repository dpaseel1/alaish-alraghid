"use client";

import { useTransition } from "react";
import { reviewLeaveRequestAction } from "@/app/actions/staffAttendance";

type Row = {
  id: string;
  userName: string;
  roleLabel: string;
  fromDate: string;
  toDate: string;
  reason: string;
};

export function LeaveRequestsTable({ requests }: { requests: Row[] }) {
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
        لا توجد طلبات إجازة بانتظار المراجعة
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-right">
            <th className="px-4 py-2 font-medium">مقدّمة الطلب</th>
            <th className="px-4 py-2 font-medium">الصفة</th>
            <th className="px-4 py-2 font-medium">من</th>
            <th className="px-4 py-2 font-medium">إلى</th>
            <th className="px-4 py-2 font-medium">السبب</th>
            <th className="px-4 py-2 font-medium">إجراء</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                {r.userName}
              </td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.roleLabel}</td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                {r.fromDate}
              </td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                {r.toDate}
              </td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-300 max-w-xs">{r.reason}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => reviewLeaveRequestAction(r.id, "APPROVED"))}
                    className="rounded-lg bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    موافقة
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => reviewLeaveRequestAction(r.id, "REJECTED"))}
                    className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-medium px-3 py-1.5 hover:bg-red-100 disabled:opacity-50"
                  >
                    رفض
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
