import { getCurrentUser, isAdminRole } from "@/lib/session";
import { buildStaffNotRecordedRows, rowsToXlsxBuffer, xlsxResponse } from "@/lib/exportData";
import { riyadhToday } from "@/lib/timezone";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("غير مصرح بالدخول", { status: 401 });
  if (!isAdminRole(user.role)) return new Response("لا تملكين صلاحية الوصول لهذه البيانات", { status: 403 });

  const rows = await buildStaffNotRecordedRows(riyadhToday());
  const fileName = "معلمات لم يسجلن حضورهن";
  const sheets = [{ name: fileName, rows }];

  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") === "json") {
    return Response.json({ sheets });
  }

  const buffer = rowsToXlsxBuffer(sheets);
  return xlsxResponse(buffer, fileName);
}
