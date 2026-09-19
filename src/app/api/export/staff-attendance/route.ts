import { getCurrentUser } from "@/lib/session";
import { resolveStaffExportScope, buildStaffAttendanceRows, rowsToXlsxBuffer, xlsxResponse } from "@/lib/exportData";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("غير مصرح بالدخول", { status: 401 });

  const scope = resolveStaffExportScope(user);
  if (!scope.ok) return new Response("لا تملكين صلاحية الوصول لهذه البيانات", { status: 403 });

  const { searchParams } = new URL(request.url);
  const toDate = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  toDate.setHours(23, 59, 59, 999);
  const fromDate = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(toDate);
  if (!searchParams.get("from")) fromDate.setDate(fromDate.getDate() - 30);
  fromDate.setHours(0, 0, 0, 0);

  const rows = await buildStaffAttendanceRows(scope.staffWhere, fromDate, toDate);
  const fileName = "حضور وغياب المعلمات";
  const sheets = [{ name: fileName, rows }];

  if (searchParams.get("format") === "json") {
    return Response.json({ sheets });
  }

  const buffer = rowsToXlsxBuffer(sheets);
  return xlsxResponse(buffer, fileName);
}
