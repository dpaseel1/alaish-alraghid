import { getCurrentUser } from "@/lib/session";
import { buildStudentImportTemplateBuffer, xlsxResponse } from "@/lib/exportData";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("غير مصرح بالدخول", { status: 401 });

  const buffer = buildStudentImportTemplateBuffer();
  return xlsxResponse(buffer, "قالب-استيراد-الطالبات");
}
