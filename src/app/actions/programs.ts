"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { fileToReportDataUrl } from "@/lib/fileUpload";

export type ProgramActionState = { error?: string; success?: string };

const programSchema = z.object({
  name: z.string().trim().min(2, "اسم البرنامج قصير جدًا").max(150, "اسم البرنامج طويل جدًا"),
  description: z.string().trim().max(2000, "وصف البرنامج طويل جدًا").optional().or(z.literal("")),
  duration: z.string().trim().min(1, "مدة البرنامج مطلوبة").max(50, "مدة البرنامج طويلة جدًا"),
  academicYear: z.string().trim().min(1, "العام الدراسي مطلوب").max(20, "العام الدراسي طويل جدًا"),
});

export async function createProgramAction(
  _prev: ProgramActionState | undefined,
  formData: FormData
): Promise<ProgramActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    academicYear: formData.get("academicYear"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { dataUrl: reportUrl, fileName: reportFileName, error: reportError } =
    await fileToReportDataUrl(formData.get("report"));
  if (reportError) return { error: reportError };

  const program = await db.program.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration: parsed.data.duration,
      academicYear: parsed.data.academicYear,
      ...(reportUrl ? { reportUrl, reportFileName } : {}),
    },
  });

  await logAudit({
    actor,
    action: "PROGRAM_CREATE",
    targetType: "Program",
    targetId: program.id,
    targetLabel: program.name,
    message: `أضافت برنامجًا جديدًا "${program.name}" ضمن سجل الإنجازات`,
  });

  revalidatePath("/achievements");
  redirect("/achievements");
}

export async function updateProgramAction(
  programId: string,
  _prev: ProgramActionState | undefined,
  formData: FormData
): Promise<ProgramActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    academicYear: formData.get("academicYear"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return { error: "البرنامج غير موجود" };

  const { dataUrl: reportUrl, fileName: reportFileName, error: reportError } =
    await fileToReportDataUrl(formData.get("report"));
  if (reportError) return { error: reportError };

  await db.program.update({
    where: { id: programId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration: parsed.data.duration,
      academicYear: parsed.data.academicYear,
      ...(reportUrl ? { reportUrl, reportFileName } : {}),
    },
  });

  await logAudit({
    actor,
    action: "PROGRAM_UPDATE",
    targetType: "Program",
    targetId: programId,
    targetLabel: parsed.data.name,
    message: `عدّلت بيانات البرنامج "${parsed.data.name}" ضمن سجل الإنجازات`,
  });

  revalidatePath("/achievements");
  redirect("/achievements");
}

export async function deleteProgramAction(programId: string) {
  const actor = await requireRole("ADMIN");

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return;

  await db.program.delete({ where: { id: programId } });

  await logAudit({
    actor,
    action: "PROGRAM_DELETE",
    targetType: "Program",
    targetId: programId,
    targetLabel: program.name,
    message: `حذفت البرنامج "${program.name}" من سجل الإنجازات`,
  });

  revalidatePath("/achievements");
}
