import { getCurrentUser } from "@/lib/session";
import { resolveExportScope, buildStudentsRows, rowsToXlsxBuffer, xlsxResponse } from "@/lib/exportData";

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

  const rows = await buildStudentsRows(scope.halaqaWhere);
  const buffer = rowsToXlsxBuffer([{ name: "الطالبات", rows }]);
  return xlsxResponse(buffer, "الطالبات");
}
