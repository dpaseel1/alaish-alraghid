"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { requireRole, requireUser, isAdminRole } from "@/lib/session";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { riyadhToday, riyadhFullWeekDays } from "@/lib/timezone";
import { HALAQA_DAYS } from "@/lib/halaqaDays";
import { requiredStudentProfileFields, nameSchema } from "@/lib/validation";
import { encryptNationalId, decryptNationalId, lastFourOf } from "@/lib/crypto";
import { normalizeDigits } from "@/lib/numbers";

export type StudentActionState = { error?: string; success?: string };

const studentSchema = z.object({
  name: nameSchema,
  nationality: z.string().trim().min(2, "الرجاء تحديد الجنسية"),
  halaqaId: z.string().min(1, "الرجاء اختيار الحلقة"),
  currentQuota: z.string().trim().optional().or(z.literal("")),
  ...requiredStudentProfileFields,
});

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

const IMPORT_HEADER_MAP = {
  name: "الاسم",
  nationality: "الجنسية",
  nationalId: "رقم الهوية/الإقامة",
  age: "العمر",
  educationLevel: "المؤهل الدراسي",
  residence: "مقر الإقامة",
  memorizedAmount: "مقدار الحفظ",
} as const;

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

  let rows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { successCount: 0, failures: [], error: "تعذّر قراءة الملف، تأكدي أنه بصيغة Excel صحيحة" };
  }

  const importRowSchema = studentSchema.omit({ halaqaId: true, currentQuota: true });
  const failures: { row: number; message: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parsed = importRowSchema.safeParse({
      name: row[IMPORT_HEADER_MAP.name],
      nationality: row[IMPORT_HEADER_MAP.nationality],
      nationalId: row[IMPORT_HEADER_MAP.nationalId],
      age: row[IMPORT_HEADER_MAP.age],
      educationLevel: row[IMPORT_HEADER_MAP.educationLevel],
      residence: row[IMPORT_HEADER_MAP.residence],
      memorizedAmount: row[IMPORT_HEADER_MAP.memorizedAmount],
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
  const user = await requireRole("TEACHER");

  const halaqa = await db.halaqa.findUnique({
    where: { teacherId: user.id },
    include: { students: { where: { isActive: true } } },
  });
  if (!halaqa) return { error: "لا توجد حلقة مرتبطة بحسابك" };

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

  for (const student of halaqa.students) {
    const pagesRaw = formData.get(`pages_${student.id}`);
    const quotaRaw = formData.get(`quota_${student.id}`);
    const pages = pagesRaw ? parseInt(String(pagesRaw), 10) : 0;
    const quota = quotaRaw ? String(quotaRaw).trim() : "";

    if (pages > 0) {
      await db.memorizationRecord.create({
        data: {
          studentId: student.id,
          date: today,
          pagesMemorized: pages,
          quota: quota || null,
          enteredById: user.id,
        },
      });

      await db.student.update({
        where: { id: student.id },
        data: {
          memorizedPagesTotal: { increment: pages },
          ...(quota ? { currentQuota: quota } : {}),
        },
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
  present: boolean
) {
  const user = await requireRole("TEACHER");

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { halaqa: true },
  });
  if (!student || student.halaqa.teacherId !== user.id) return;

  const date = new Date(dateIso);
  // الأيام المسموح بها: أيام انعقاد الحلقة المحددة (وقد تشمل الجمعة/السبت) ضمن الأسبوع الحالي، أو الأسبوع الدراسي الافتراضي (الأحد-الخميس) إن لم تُحدَّد أيام
  const scheduledDays = student.halaqa.days.length > 0 ? new Set(student.halaqa.days) : null;
  const fullWeek = riyadhFullWeekDays();
  const validDates = (scheduledDays
    ? fullWeek.filter((d) => scheduledDays.has(HALAQA_DAYS[d.getUTCDay()]))
    : fullWeek.slice(0, 5)
  ).map((d) => d.getTime());
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

  await db.studentAttendance.upsert({
    where: {
      attendanceLogId_studentId: {
        attendanceLogId: attendanceLog.id,
        studentId,
      },
    },
    create: { attendanceLogId: attendanceLog.id, studentId, present },
    update: { present },
  });

  await logAudit({
    actor: user,
    action: "STUDENT_ATTENDANCE_TOGGLE",
    targetType: "Student",
    targetId: student.id,
    targetLabel: student.name,
    message: `سجّلت ${present ? "حضور" : "غياب"} الطالبة ليوم ${dateIso}`,
  });

  revalidatePath("/students");
  revalidatePath("/");
  revalidatePath("/honor-board");
}
