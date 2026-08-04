import { getCurrentUser } from "@/lib/session";
import { resolveExportScope, buildAttendanceRows, rowsToXlsxBuffer, xlsxResponse } from "@/lib/exportData";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("غير مصرح بالدخول", { status: 401 });

  const { searchParams } = new URL(request.url);
  const scope = await resolveExportScope(user, {
    halaqaId: searchParams.get("halaqaId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!scope.ok) return new Response("لا تملكين صلاحية الوصول لهذه البيانات", { status: 403 });

  const rows = await buildAttendanceRows(scope.halaqaWhere, scope.fromDate, scope.toDate);
  const buffer = rowsToXlsxBuffer([{ name: "الحضور والغياب", rows }]);
  return xlsxResponse(buffer, "الحضور والغياب");
}
