import "server-only";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

type HalaqaWhere = Record<string, unknown>;

export type ExportScope = {
  ok: true;
  halaqaWhere: HalaqaWhere;
  fromDate: Date;
  toDate: Date;
};

/**
 * يحدد نطاق الصلاحية على مستوى الحلقات (نفس منطق صفحة /reports)، ويتحقق أن
 * halaqaId المطلوب (إن وجد) يقع ضمن نطاق المستخدم. يرجّع {ok:false} إن لم
 * يكن للمستخدم صلاحية وصول لأي بيانات (مثلًا معلمة بلا حلقة).
 */
export async function resolveExportScope(
  user: User,
  params: { halaqaId?: string; from?: string; to?: string }
): Promise<ExportScope | { ok: false }> {
  const halaqaWhere: HalaqaWhere = { isActive: true };
  let restrictedId: string | undefined;

  if (user.role === "SUPERVISOR") {
    halaqaWhere.supervisorId = user.id;
  } else if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({ where: { teacherId: user.id } });
    if (!halaqa) return { ok: false };
    restrictedId = halaqa.id;
  } else if (user.role !== "ADMIN" && user.role !== "DEVELOPER") {
    return { ok: false };
  }

  if (restrictedId) {
    if (params.halaqaId && params.halaqaId !== restrictedId) return { ok: false };
    halaqaWhere.id = restrictedId;
  } else if (params.halaqaId) {
    halaqaWhere.id = params.halaqaId;
  }

  const toDate = params.to ? new Date(params.to) : new Date();
  toDate.setHours(23, 59, 59, 999);
  const fromDate = params.from ? new Date(params.from) : new Date(toDate);
  if (!params.from) fromDate.setDate(fromDate.getDate() - 30);
  fromDate.setHours(0, 0, 0, 0);

  return { ok: true, halaqaWhere, fromDate, toDate };
}

export async function buildStudentsRows(halaqaWhere: HalaqaWhere) {
  const halaqat = await db.halaqa.findMany({
    where: halaqaWhere,
    select: {
      name: true,
      students: {
        select: {
          name: true,
          nationality: true,
          memorizedPagesTotal: true,
          currentQuota: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows: Record<string, string | number>[] = [];
  for (const h of halaqat) {
    for (const s of h.students) {
      rows.push({
        "الاسم": s.name,
        "الحلقة": h.name,
        "الجنسية": s.nationality,
        "إجمالي الأوجه المحفوظة": s.memorizedPagesTotal,
        "النصاب الحالي": s.currentQuota ?? "",
        "الحالة": s.isActive ? "نشطة" : "غير نشطة",
      });
    }
  }
  return rows;
}

export async function buildAttendanceRows(halaqaWhere: HalaqaWhere, fromDate: Date, toDate: Date) {
  const records = await db.studentAttendance.findMany({
    where: {
      student: { isActive: true },
      attendanceLog: {
        date: { gte: fromDate, lte: toDate },
        halaqa: halaqaWhere,
      },
    },
    include: {
      student: { select: { name: true } },
      attendanceLog: { select: { date: true, halaqa: { select: { name: true } } } },
    },
    orderBy: { attendanceLog: { date: "desc" } },
  });

  return records.map((a) => ({
    "الطالبة": a.student.name,
    "الحلقة": a.attendanceLog.halaqa.name,
    "التاريخ": a.attendanceLog.date.toISOString().slice(0, 10),
    "الحالة": a.present ? "حاضرة" : "غائبة",
  }));
}

export async function buildGradesRows(halaqaWhere: HalaqaWhere, fromDate: Date, toDate: Date) {
  const grades = await db.examGrade.findMany({
    where: {
      student: { isActive: true, halaqa: halaqaWhere },
      examDate: { gte: fromDate, lte: toDate },
    },
    include: {
      student: { select: { name: true, halaqa: { select: { name: true } } } },
    },
    orderBy: { examDate: "desc" },
  });

  return grades.map((g) => ({
    "الطالبة": g.student.name,
    "الحلقة": g.student.halaqa.name,
    "النصاب": g.quota,
    "الدرجة": g.grade,
    "من": g.maxGrade,
    "تاريخ الاختبار": g.examDate.toISOString().slice(0, 10),
  }));
}

export function rowsToXlsxBuffer(sheets: { name: string; rows: Record<string, unknown>[] }[]): Buffer {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const data = sheet.rows.length ? sheet.rows : [{ "تنبيه": "لا توجد بيانات ضمن هذا النطاق" }];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function xlsxResponse(buffer: Buffer, fileName: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(
        fileName
      )}.xlsx`,
    },
  });
}
