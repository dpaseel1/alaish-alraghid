"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { requireRole, requireUser, isAdminRole } from "@/lib/session";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { riyadhToday, riyadhFullWeekDays, riyadhWeekStart } from "@/lib/timezone";
import { HALAQA_DAYS } from "@/lib/halaqaDays";
import { requiredStudentProfileFields, nameSchema } from "@/lib/validation";
import { STUDENT_IMPORT_FIELDS, type StudentImportFieldKey } from "@/lib/studentImportFields";
import { encryptNationalId, decryptNationalId, lastFourOf } from "@/lib/crypto";
import { normalizeDigits } from "@/lib/numbers";
import type { StudentAttendanceStatus } from "@/generated/prisma/client";
import { STUDENT_ATTENDANCE_STATUSES, STUDENT_ATTENDANCE_LABELS } from "@/lib/studentAttendance";

export type StudentActionState = { error?: string; success?: string };

const studentSchema = z.object({
  name: nameSchema,
  nationality: z.string().trim().min(2, "الرجاء تحديد الجنسية"),
  halaqaId: z.string().min(1, "الرجاء اختيار الحلقة"),
  currentQuota: z.string().trim().optional().or(z.literal("")),
  ...requiredStudentProfileFields,
});

/** الأيام المسموح بها لتسجيل الحضور: أيام انعقاد الحلقة المحددة ضمن الأسبوع الحالي، أو الأسبوع الدراسي الافتراضي (الأحد-الخميس) إن لم تُحدَّد أيام */
function getValidHalaqaDates(days: string[]): number[] {
  const scheduledDays = days.length > 0 ? new Set(days) : null;
  const fullWeek = riyadhFullWeekDays();
  return (
    scheduledDays ? fullWeek.filter((d) => scheduledDays.has(HALAQA_DAYS[d.getUTCDay()])) : fullWeek.slice(0, 5)
  ).map((d) => d.getTime());
}

async function assertHalaqaAccess(halaqaId: string) {
  const user = await requireUser();
  const halaqa = await db.halaqa.findUnique({ where: { id: halaqaId } });
  if (!halaqa) return { user, ok: false as const };

  if (isAdminRole(user.role)) return { user, ok: true as const, halaqa };
  if (user.role === "SUPERVISOR")
    return { user, ok: halaqa.trackId != null && halaqa.trackId === user.supervisedTrackId, halaqa };
  if (user.role === "TEACHER")
    return { user, ok: halaqa.teacherId === user.id, halaqa };
  return { user, ok: false as const, halaqa };
}

/**
 * تحدد "حلقة المشغِّلة" التي تُدخِل عليها بيانات اليوم/الاستيراد: المعلمة تعمل على حلقتها المرتبطة بحسابها تلقائيًا،
 * والمشرفة تعمل على أي حلقة ضمن مسارها تُرسَل صراحةً عبر حقل halaqaId (لعدم وجود حلقة واحدة مرتبطة بحسابها مباشرة)
 */
async function resolveOperatorHalaqa(formData: FormData) {
  const user = await requireRole("TEACHER", "SUPERVISOR");

  if (user.role === "TEACHER") {
    const halaqa = await db.halaqa.findUnique({
      where: { teacherId: user.id },
      include: { students: { where: { isActive: true } } },
    });
    if (!halaqa) return { error: "لا توجد حلقة مرتبطة بحسابك" as const };
    return { user, halaqa };
  }

  const halaqaId = String(formData.get("halaqaId") ?? "");
  if (!halaqaId) return { error: "الرجاء تحديد الحلقة" as const };

  const halaqa = await db.halaqa.findUnique({
    where: { id: halaqaId },
    include: { students: { where: { isActive: true } } },
  });
  if (!halaqa || halaqa.trackId == null || halaqa.trackId !== user.supervisedTrackId) {
    return { error: "لا تملكين صلاحية الوصول لهذه الحلقة" as const };
  }
  return { user, halaqa };
}

export async function createStudentAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    nationality: formData.get("nationality"),
    halaqaId: formData.get("halaqaId"),
    currentQuota: formData.get("currentQuota"),
    nationalId: formData.get("nationalId"),
    age: formData.get("age"),
    educationLevel: formData.get("educationLevel"),
    residence: formData.get("residence"),
    memorizedAmount: formData.get("memorizedAmount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { ok, user } = await assertHalaqaAccess(parsed.data.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية الإضافة لهذه الحلقة" };

  const student = await db.student.create({
    data: {
      name: parsed.data.name,
      nationality: parsed.data.nationality,
      halaqaId: parsed.data.halaqaId,
      currentQuota: parsed.data.currentQuota || null,
      nationalIdEncrypted: encryptNationalId(parsed.data.nationalId),
      nationalIdLastFour: lastFourOf(parsed.data.nationalId),
      age: parsed.data.age,
      educationLevel: parsed.data.educationLevel,
      residence: parsed.data.residence,
      memorizedAmount: parsed.data.memorizedAmount,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_CREATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: "أضافت طالبة جديدة",
  });

  revalidatePath("/students");
  revalidatePath("/");
  return { success: "تمت إضافة الطالبة بنجاح" };
}

export async function updateStudentAction(
  studentId: string,
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "الطالبة غير موجودة" };

  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية تعديل بيانات هذه الطالبة" };

  const parsed = studentSchema
    .omit({ halaqaId: true })
    .safeParse({
      name: formData.get("name"),
      nationality: formData.get("nationality"),
      currentQuota: formData.get("currentQuota"),
      nationalId: formData.get("nationalId"),
      age: formData.get("age"),
      educationLevel: formData.get("educationLevel"),
      residence: formData.get("residence"),
      memorizedAmount: formData.get("memorizedAmount"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.student.update({
    where: { id: studentId },
    data: {
      name: parsed.data.name,
      nationality: parsed.data.nationality,
      currentQuota: parsed.data.currentQuota || null,
      nationalIdEncrypted: encryptNationalId(parsed.data.nationalId),
      nationalIdLastFour: lastFourOf(parsed.data.nationalId),
      age: parsed.data.age,
      educationLevel: parsed.data.educationLevel,
      residence: parsed.data.residence,
      memorizedAmount: parsed.data.memorizedAmount,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_UPDATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: parsed.data.name,
    message: "عدّلت بيانات الطالبة",
  });

  revalidatePath("/students");
  return { success: "تم تحديث بيانات الطالبة" };
}

export async function deleteStudentAction(studentId: string) {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;
  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return;

  await db.student.update({ where: { id: studentId }, data: { isActive: false } });

  await logAudit({
    actor: user,
    action: "STUDENT_DELETE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: "حذفت الطالبة",
  });

  revalidatePath("/students");
  revalidatePath("/");
}

export async function reactivateStudentAction(studentId: string) {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;
  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return;

  await db.student.update({ where: { id: studentId }, data: { isActive: true } });

  await logAudit({
    actor: user,
    action: "STUDENT_REACTIVATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: "استعادت الطالبة من الأرشيف",
  });

  revalidatePath("/students");
  revalidatePath("/");
}

export type ImportStudentsResult = {
  successCount: number;
  failures: { row: number; message: string }[];
  error?: string;
};

/** استيراد طالبات دفعة واحدة من ملف Excel لحلقة محددة (نفس تحقق الإضافة اليدوية لكل صف) */
export async function importStudentsAction(
  _prev: ImportStudentsResult | undefined,
  formData: FormData
): Promise<ImportStudentsResult> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const halaqaId = String(formData.get("halaqaId") ?? "");
  const { ok, user, halaqa } = await assertHalaqaAccess(halaqaId);
  if (!ok || !halaqa) return { successCount: 0, failures: [], error: "لا تملكين صلاحية الإضافة لهذه الحلقة" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { successCount: 0, failures: [], error: "الرجاء اختيار ملف Excel" };
  }

  let columnMapping: Record<StudentImportFieldKey, number>;
  try {
    const parsedMapping = JSON.parse(String(formData.get("columnMapping") ?? ""));
    if (!STUDENT_IMPORT_FIELDS.every((f) => typeof parsedMapping[f.key] === "number")) throw new Error();
    columnMapping = parsedMapping;
  } catch {
    return { successCount: 0, failures: [], error: "تعذّر التعرف على أعمدة الملف، أعيدي رفعه" };
  }

  let dataRows: unknown[][];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
    dataRows = rawRows.slice(1); // تجاهل صف الرأس
  } catch {
    return { successCount: 0, failures: [], error: "تعذّر قراءة الملف، تأكدي أنه بصيغة Excel صحيحة" };
  }

  const importRowSchema = studentSchema.omit({ halaqaId: true, currentQuota: true });
  const failures: { row: number; message: string }[] = [];
  let successCount = 0;

  // خلايا Excel الرقمية (مثل رقم الهوية) تُقرأ كأرقام JS لا كنصوص، فتُحوَّل لنص هنا
  // كي تتوافق مع مخططات zod التي تتوقع نصوصًا (نفس ما يُدخله المستخدم يدويًا من نموذج HTML)
  const cell = (v: unknown): string => (v === undefined || v === null ? "" : String(v).trim());

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const parsed = importRowSchema.safeParse({
      name: cell(row[columnMapping.name]),
      nationality: cell(row[columnMapping.nationality]),
      nationalId: cell(row[columnMapping.nationalId]),
      age: cell(row[columnMapping.age]),
      educationLevel: cell(row[columnMapping.educationLevel]),
      residence: cell(row[columnMapping.residence]),
      memorizedAmount: cell(row[columnMapping.memorizedAmount]),
    });

    if (!parsed.success) {
      failures.push({ row: i + 2, message: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      continue;
    }

    await db.student.create({
      data: {
        name: parsed.data.name,
        nationality: parsed.data.nationality,
        halaqaId,
        nationalIdEncrypted: encryptNationalId(parsed.data.nationalId),
        nationalIdLastFour: lastFourOf(parsed.data.nationalId),
        age: parsed.data.age,
        educationLevel: parsed.data.educationLevel,
        residence: parsed.data.residence,
        memorizedAmount: parsed.data.memorizedAmount,
      },
    });
    successCount++;
  }

  await logAudit({
    actor: user,
    action: "STUDENT_IMPORT",
    targetType: "Halaqa",
    targetId: halaqa.id,
    targetLabel: halaqa.name,
    message: `استوردت ${successCount} طالبة من ملف Excel إلى حلقة ${halaqa.name}${
      failures.length ? ` (${failures.length} صف مرفوض)` : ""
    }`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  return { successCount, failures };
}

/** تسجيل بيانات اليوم: الحضور + الأوجه المحفوظة لكل طالبات الحلقة دفعة واحدة */
export async function submitDailyDataAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  const resolved = await resolveOperatorHalaqa(formData);
  if ("error" in resolved) return { error: resolved.error };
  const { user, halaqa } = resolved;

  const today = riyadhToday();

  await db.attendanceLog.upsert({
    where: { halaqaId_date: { halaqaId: halaqa.id, date: today } },
    create: {
      halaqaId: halaqa.id,
      date: today,
      teacherPresent: true,
      dataSubmitted: true,
      submittedAt: new Date(),
    },
    update: { dataSubmitted: true, submittedAt: new Date() },
  });

  const uniformQuotaRaw = halaqa.uniformQuota ? String(formData.get("quota") ?? "").trim() : null;

  const entries: { student: (typeof halaqa.students)[number]; pages: number; quota: string }[] = [];
  for (const student of halaqa.students) {
    const pagesRaw = formData.get(`pages_${student.id}`);
    const quotaRaw = halaqa.uniformQuota ? uniformQuotaRaw : formData.get(`quota_${student.id}`);
    const pagesStr = pagesRaw ? normalizeDigits(String(pagesRaw)).trim() : "";
    const quota = quotaRaw ? String(quotaRaw).trim() : "";

    if (!pagesStr) {
      entries.push({ student, pages: 0, quota });
      continue;
    }

    const pages = Number(pagesStr);
    if (!Number.isInteger(pages) || pages < 0) {
      return { error: `الرجاء إدخال رقم صحيح للأوجه المحفوظة لـ"${student.name}"` };
    }
    entries.push({ student, pages, quota });
  }

  for (const { student, pages, quota } of entries) {
    if (pages > 0) {
      const existing = await db.memorizationRecord.findUnique({
        where: { studentId_date: { studentId: student.id, date: today } },
      });
      const delta = pages - (existing?.pagesMemorized ?? 0);

      await db.memorizationRecord.upsert({
        where: { studentId_date: { studentId: student.id, date: today } },
        create: {
          studentId: student.id,
          date: today,
          pagesMemorized: pages,
          quota: quota || null,
          enteredById: user.id,
        },
        update: {
          pagesMemorized: pages,
          quota: quota || null,
          enteredById: user.id,
        },
      });

      await db.student.update({
        where: { id: student.id },
        data: {
          memorizedPagesTotal: { increment: delta },
          ...(quota ? { currentQuota: quota } : {}),
        },
      });
    } else if (quota) {
      // النصاب أُدخل لكن ما أُدخل عدد أوجه لهذه الطالبة اليوم (شائع في وضع النصاب الموحّد) — يُحفظ النصاب
      // بلا التأثير على عدد الأوجه المحفوظة سابقًا لهذا اليوم إن وُجد
      await db.memorizationRecord.upsert({
        where: { studentId_date: { studentId: student.id, date: today } },
        create: {
          studentId: student.id,
          date: today,
          pagesMemorized: 0,
          quota,
          enteredById: user.id,
        },
        update: {
          quota,
          enteredById: user.id,
        },
      });

      await db.student.update({
        where: { id: student.id },
        data: { currentQuota: quota },
      });
    }
  }

  await logAudit({
    actor: user,
    action: "DAILY_DATA_SUBMIT",
    targetType: "Halaqa",
    targetId: halaqa.id,
    targetLabel: halaqa.name,
    message: `سجّلت بيانات الحضور والحفظ اليومية (${halaqa.students.length} طالبة)`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: "تم حفظ بيانات اليوم بنجاح" };
}

const digitsNumber = (min: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? normalizeDigits(v) : v),
    z.coerce.number().min(min)
  );

const studentNumbersSchema = z.object({
  memorizedPagesTotal: digitsNumber(0),
  reviewedPagesTotal: digitsNumber(0),
  currentQuota: z.string().trim().optional().or(z.literal("")),
});

/** تعديل مباشر لإجمالي الأوجه المحفوظة وعدد أوجه المراجعة والنصاب الحالي لطالبة (لتصحيح الأرقام يدويًا) */
export async function updateStudentNumbersAction(
  studentId: string,
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "الطالبة غير موجودة" };

  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية تعديل بيانات هذه الطالبة" };

  const parsed = studentNumbersSchema.safeParse({
    memorizedPagesTotal: formData.get("memorizedPagesTotal"),
    reviewedPagesTotal: formData.get("reviewedPagesTotal"),
    currentQuota: formData.get("currentQuota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await db.student.update({
    where: { id: studentId },
    data: {
      memorizedPagesTotal: parsed.data.memorizedPagesTotal,
      reviewedPagesTotal: parsed.data.reviewedPagesTotal,
      currentQuota: parsed.data.currentQuota || null,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_NUMBERS_UPDATE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: `عدّلت إجمالي الأوجه المحفوظة إلى ${parsed.data.memorizedPagesTotal} وعدد أوجه المراجعة إلى ${parsed.data.reviewedPagesTotal} والنصاب الحالي إلى ${parsed.data.currentQuota || "—"}`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/halaqat");
  return { success: "تم تحديث بيانات الطالبة" };
}

const memorizationRecordSchema = z.object({
  pagesMemorized: digitsNumber(0),
  quota: z.string().trim().optional().or(z.literal("")),
});

/** تعديل مباشر لسجل تسميع يومي سابق (الأوجه المحفوظة والنصاب) من صفحة الأرشيف، مع تصحيح إجمالي الطالبة تلقائيًا بمقدار الفرق فقط */
export async function updateMemorizationRecordAction(
  recordId: string,
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const record = await db.memorizationRecord.findUnique({
    where: { id: recordId },
    include: { student: true },
  });
  if (!record) return { error: "السجل غير موجود" };

  const { ok, user } = await assertHalaqaAccess(record.student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية تعديل هذا السجل" };

  const parsed = memorizationRecordSchema.safeParse({
    pagesMemorized: formData.get("pagesMemorized"),
    quota: formData.get("quota"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const delta = parsed.data.pagesMemorized - record.pagesMemorized;

  await db.$transaction([
    db.memorizationRecord.update({
      where: { id: recordId },
      data: {
        pagesMemorized: parsed.data.pagesMemorized,
        quota: parsed.data.quota || null,
      },
    }),
    db.student.update({
      where: { id: record.studentId },
      data: { memorizedPagesTotal: { increment: delta } },
    }),
  ]);

  await logAudit({
    actor: user,
    action: "MEMORIZATION_RECORD_UPDATE",
    targetType: "Student",
    targetId: record.student.id,
    targetLabel: record.student.name,
    message: `عدّلت سجل تسميع يوم ${record.date.toISOString().slice(0, 10)} من ${record.pagesMemorized} إلى ${parsed.data.pagesMemorized} وجهًا (النصاب: ${parsed.data.quota || "—"})`,
  });

  revalidatePath("/certificates");
  revalidatePath("/students");
  revalidatePath("/");

  return { success: "تم تحديث السجل" };
}

const examGradeSchema = z.object({
  studentId: z.string().min(1),
  quota: z.string().trim().min(1, "الرجاء تحديد النصاب"),
  grade: digitsNumber(0),
  maxGrade: digitsNumber(1).default(100),
  examDate: z.string().min(1, "الرجاء تحديد تاريخ الاختبار"),
});

export async function addExamGradeAction(
  _prev: StudentActionState | undefined,
  formData: FormData
): Promise<StudentActionState> {
  const user = await requireRole("ADMIN", "SUPERVISOR", "TEACHER");

  const parsed = examGradeSchema.safeParse({
    studentId: formData.get("studentId"),
    quota: formData.get("quota"),
    grade: formData.get("grade"),
    maxGrade: formData.get("maxGrade") || 100,
    examDate: formData.get("examDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const student = await db.student.findUnique({
    where: { id: parsed.data.studentId },
  });
  if (!student) return { error: "الطالبة غير موجودة" };
  const { ok } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return { error: "لا تملكين صلاحية إضافة درجة لهذه الطالبة" };

  await db.examGrade.create({
    data: {
      studentId: parsed.data.studentId,
      quota: parsed.data.quota,
      grade: parsed.data.grade,
      maxGrade: parsed.data.maxGrade,
      examDate: new Date(parsed.data.examDate),
      enteredById: user.id,
    },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_GRADE_ADD",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: `سجّلت درجة اختبار (${parsed.data.quota}: ${parsed.data.grade}/${parsed.data.maxGrade}) للطالبة`,
  });

  revalidatePath("/students");
  revalidatePath("/reports");
  revalidatePath("/certificates");
  return { success: "تم تسجيل الدرجة بنجاح" };
}

/** المديرة/المشرفة فقط تقدر تكشف رقم هوية/إقامة الطالبة الكامل */
export async function revealStudentNationalIdAction(
  studentId: string
): Promise<{ nationalId: string } | { error: string }> {
  await requireRole("ADMIN", "SUPERVISOR");
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return { error: "الطالبة غير موجودة" };
  if (!student.nationalIdEncrypted) return { error: "لا يوجد رقم هوية مسجّل لهذه الطالبة" };
  try {
    return { nationalId: decryptNationalId(student.nationalIdEncrypted) };
  } catch {
    return { error: "تعذّر فك تشفير رقم الهوية/الإقامة" };
  }
}

/** تبديل حضور/غياب طالبة ليوم واحد ضمن الأسبوع الحالي، مقيّد بأيام انعقاد الحلقة المحددة (وقد تشمل الجمعة/السبت) إن حُدِّدت، وإلا فالأسبوع الدراسي الافتراضي (الأحد-الخميس) */
export async function toggleStudentAttendanceAction(
  studentId: string,
  dateIso: string,
  status: StudentAttendanceStatus
) {
  if (!STUDENT_ATTENDANCE_STATUSES.includes(status)) return;

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { halaqa: true },
  });
  if (!student) return;

  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return;

  const date = new Date(dateIso);
  const validDates = getValidHalaqaDates(student.halaqa.days);
  if (!validDates.includes(date.getTime())) return; // منع التلاعب بتواريخ خارج الأيام المسموحة

  const attendanceLog = await db.attendanceLog.upsert({
    where: { halaqaId_date: { halaqaId: student.halaqaId, date } },
    create: {
      halaqaId: student.halaqaId,
      date,
      teacherPresent: true,
      dataSubmitted: true,
      submittedAt: new Date(),
    },
    update: { dataSubmitted: true, submittedAt: new Date() },
  });

  const existing = await db.studentAttendance.findUnique({
    where: {
      attendanceLogId_studentId: {
        attendanceLogId: attendanceLog.id,
        studentId,
      },
    },
  });

  const shouldClear = existing?.status === status;

  if (shouldClear) {
    await db.studentAttendance.delete({ where: { id: existing!.id } });
  } else {
    await db.studentAttendance.upsert({
      where: {
        attendanceLogId_studentId: {
          attendanceLogId: attendanceLog.id,
          studentId,
        },
      },
      create: { attendanceLogId: attendanceLog.id, studentId, status },
      update: { status },
    });
  }

  await logAudit({
    actor: user,
    action: "STUDENT_ATTENDANCE_TOGGLE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: shouldClear
      ? `أزالت تحضير الطالبة ليوم ${dateIso}`
      : `سجّلت (${STUDENT_ATTENDANCE_LABELS[status]}) للطالبة ليوم ${dateIso}`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/honor-board");
}

export type ImportAttendanceResult = {
  successCount: number;
  absentCount: number;
  failures: { row: number; message: string }[];
  error?: string;
};

/**
 * استيراد حضور يوم واحد لكل طالبات الحلقة من ملف Excel (مثل استبانات مايكروسوفت فورمز): تُطابَق أسماء الملف مع طالبات
 * الحلقة في المتصفح مسبقًا (مطابقة تلقائية + مراجعة يدوية)، فيصل هذا الإجراء بقائمة معرّفات الطالبات المطابَقة (الحاضرات) جاهزة.
 * كل طالبة نشطة في الحلقة لم تُطابَق ضمن الملف تُسجَّل تلقائيًا "غياب بدون عذر" لنفس اليوم.
 */
export async function importAttendanceExcelAction(
  _prev: ImportAttendanceResult | undefined,
  formData: FormData
): Promise<ImportAttendanceResult> {
  const resolved = await resolveOperatorHalaqa(formData);
  if ("error" in resolved) return { successCount: 0, absentCount: 0, failures: [], error: resolved.error };
  const { user, halaqa } = resolved;

  const dateIso = String(formData.get("dateIso") ?? "");
  const date = new Date(dateIso);
  const validDates = getValidHalaqaDates(halaqa.days);
  if (!dateIso || !validDates.includes(date.getTime())) {
    return {
      successCount: 0,
      absentCount: 0,
      failures: [],
      error: "الرجاء اختيار يوم صحيح من أيام انعقاد الحلقة هذا الأسبوع",
    };
  }

  let presentStudentIds: string[];
  try {
    const parsed = JSON.parse(String(formData.get("presentStudentIds") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error();
    presentStudentIds = parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return { successCount: 0, absentCount: 0, failures: [], error: "بيانات المطابقة غير صحيحة" };
  }

  const rosterIds = new Set(halaqa.students.map((s) => s.id));
  const presentIds = [...new Set(presentStudentIds.filter((id) => rosterIds.has(id)))];
  if (presentIds.length === 0) {
    return {
      successCount: 0,
      absentCount: 0,
      failures: [],
      error: "لم تتم مطابقة أي طالبة من الملف، تأكدي من المطابقة ثم أعيدي المحاولة",
    };
  }

  const presentSet = new Set(presentIds);
  const absentIds = halaqa.students.filter((s) => !presentSet.has(s.id)).map((s) => s.id);

  const attendanceLog = await db.attendanceLog.upsert({
    where: { halaqaId_date: { halaqaId: halaqa.id, date } },
    create: { halaqaId: halaqa.id, date, teacherPresent: true, dataSubmitted: true, submittedAt: new Date() },
    update: { dataSubmitted: true, submittedAt: new Date() },
  });

  const results: { studentId: string; status: StudentAttendanceStatus }[] = [
    ...presentIds.map((studentId) => ({ studentId, status: "PRESENT" as const })),
    ...absentIds.map((studentId) => ({ studentId, status: "ABSENT_UNEXCUSED" as const })),
  ];

  await Promise.all(
    results.map((r) =>
      db.studentAttendance.upsert({
        where: { attendanceLogId_studentId: { attendanceLogId: attendanceLog.id, studentId: r.studentId } },
        create: { attendanceLogId: attendanceLog.id, studentId: r.studentId, status: r.status },
        update: { status: r.status },
      })
    )
  );

  await logAudit({
    actor: user,
    action: "STUDENT_ATTENDANCE_IMPORT",
    targetType: "Halaqa",
    targetId: halaqa.id,
    targetLabel: halaqa.name,
    message: `استوردت حضور ${presentIds.length} طالبة من ملف Excel ليوم ${dateIso} (${absentIds.length} غياب بدون عذر تلقائيًا)`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/honor-board");

  return { successCount: presentIds.length, absentCount: absentIds.length, failures: [] };
}

/** تضبط تسجيل "سردت" لطالبة لأسبوعها الحالي (متاح فقط للحلقات المفعّلة لديها خانة السرد) - عند التفعيل تُحسب أوجه الحفظ المسجَّلة لها هذا الأسبوع تحديدًا ضمن "عدد أوجه المراجعة" */
export async function toggleStudentRecitationAction(studentId: string, recited: boolean) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { halaqa: true },
  });
  if (!student) return;

  const { ok, user } = await assertHalaqaAccess(student.halaqaId);
  if (!ok) return;
  if (!student.halaqa.recitationEnabled) return;

  const weekStart = riyadhWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const existing = await db.weeklyRecitation.findUnique({
    where: { studentId_weekStart: { studentId, weekStart } },
  });

  let pagesRecorded = 0;
  if (recited) {
    const agg = await db.memorizationRecord.aggregate({
      _sum: { pagesMemorized: true },
      where: { studentId, date: { gte: weekStart, lt: weekEnd } },
    });
    pagesRecorded = agg._sum.pagesMemorized ?? 0;
  }
  const pagesDelta = pagesRecorded - (existing?.pagesRecorded ?? 0);

  await db.weeklyRecitation.upsert({
    where: { studentId_weekStart: { studentId, weekStart } },
    create: { studentId, weekStart, recited, pagesRecorded, recordedById: user.id },
    update: { recited, pagesRecorded, recordedById: user.id },
  });

  if (pagesDelta !== 0) {
    await db.student.update({
      where: { id: studentId },
      data: { reviewedPagesTotal: { increment: pagesDelta } },
    });
  }

  await logAudit({
    actor: user,
    action: "STUDENT_RECITATION_TOGGLE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: `${recited ? "سجّلت" : "ألغت"} سرد الطالبة لأسبوع ${weekStart.toISOString().slice(0, 10)}`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/statistics");
}
