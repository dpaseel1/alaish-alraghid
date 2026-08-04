import { getCurrentUser } from "@/lib/session";
import {
  resolveExportScope,
  buildStudentsRows,
  buildAttendanceRows,
  buildGradesRows,
  rowsToXlsxBuffer,
  xlsxResponse,
} from "@/lib/exportData";

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

  const [students, attendance, grades] = await Promise.all([
    buildStudentsRows(scope.halaqaWhere),
    buildAttendanceRows(scope.halaqaWhere, scope.fromDate, scope.toDate),
    buildGradesRows(scope.halaqaWhere, scope.fromDate, scope.toDate),
  ]);

  const sheets = [
    { name: "الطالبات", rows: students },
    { name: "الحضور والغياب", rows: attendance },
    { name: "الدرجات", rows: grades },
  ];

  if (searchParams.get("format") === "json") {
    return Response.json({ sheets });
  }

  const buffer = rowsToXlsxBuffer(sheets);
  return xlsxResponse(buffer, "تقرير شامل");
}
