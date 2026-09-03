"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { fileToAvatarDataUrl } from "@/lib/avatar";
import { DEFAULT_CERTIFICATE_LAYOUT, type CertificateLayout } from "@/lib/certificateRender";

export type CertificateTemplateActionState = { error?: string; success?: string };

const IMAGE_KEYS = ["logoJamiyah", "logoAlaish", "stamp", "title"] as const;
const TEXT_KEYS = [
  "intro",
  "name",
  "quota",
  "onCompletion",
  "tier",
  "percent",
  "gradeLabel",
  "dua",
  "signature",
] as const;

function numOr(formData: FormData, field: string, fallback: number): number {
  const raw = formData.get(field);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function buildLayoutFromFormData(formData: FormData): CertificateLayout {
  const images = {} as CertificateLayout["images"];
  for (const key of IMAGE_KEYS) {
    const def = DEFAULT_CERTIFICATE_LAYOUT.images[key];
    images[key] = {
      x: numOr(formData, `imgX_${key}`, def.x),
      y: numOr(formData, `imgY_${key}`, def.y),
      w: numOr(formData, `imgW_${key}`, def.w),
      h: numOr(formData, `imgH_${key}`, def.h),
    };
  }

  const texts = {} as CertificateLayout["texts"];
  for (const key of TEXT_KEYS) {
    const def = DEFAULT_CERTIFICATE_LAYOUT.texts[key];
    texts[key] = {
      x: numOr(formData, `txtX_${key}`, def.x),
      y: numOr(formData, `txtY_${key}`, def.y),
      w: numOr(formData, `txtW_${key}`, def.w),
      h: def.h,
      fontSize: numOr(formData, `txtFontSize_${key}`, def.fontSize),
      color: def.color,
      align: def.align,
    };
  }

  return { images, texts };
}

const templateNameSchema = z.string().trim().min(2, "اسم القالب قصير جدًا").max(100, "اسم القالب طويل جدًا");

export async function createCertificateTemplateAction(
  _prev: CertificateTemplateActionState | undefined,
  formData: FormData
): Promise<CertificateTemplateActionState> {
  const actor = await requireRole("ADMIN");

  const parsedName = templateNameSchema.safeParse(formData.get("name"));
  if (!parsedName.success) return { error: parsedName.error.issues[0]?.message ?? "اسم غير صحيح" };

  const { dataUrl: backgroundUrl, error: imageError } = await fileToAvatarDataUrl(formData.get("background"));
  if (imageError) return { error: imageError };
  if (!backgroundUrl) return { error: "الرجاء رفع صورة خلفية للقالب" };

  const layout = buildLayoutFromFormData(formData);

  const template = await db.certificateTemplate.create({
    data: {
      name: parsedName.data,
      backgroundUrl,
      layout: layout as object,
      createdById: actor.id,
    },
  });

  await logAudit({
    actor,
    action: "CERTIFICATE_TEMPLATE_CREATE",
    targetType: "CertificateTemplate",
    targetId: template.id,
    targetLabel: template.name,
    message: `أضافت قالب شهادة جديد "${template.name}"`,
  });

  revalidatePath("/certificates/template");
  return { success: "تم إنشاء القالب بنجاح" };
}

export async function activateCertificateTemplateAction(templateId: string) {
  const actor = await requireRole("ADMIN");

  const template = await db.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) return;

  await db.$transaction([
    db.certificateTemplate.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    db.certificateTemplate.update({ where: { id: templateId }, data: { isActive: true } }),
  ]);

  await logAudit({
    actor,
    action: "CERTIFICATE_TEMPLATE_ACTIVATE",
    targetType: "CertificateTemplate",
    targetId: template.id,
    targetLabel: template.name,
    message: `فعّلت قالب الشهادة "${template.name}"`,
  });

  revalidatePath("/certificates/template");
  revalidatePath("/certificates");
}

export async function deleteCertificateTemplateAction(templateId: string) {
  const actor = await requireRole("ADMIN");

  const template = await db.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template) return;
  if (template.isActive) return; // يُمنع حذف القالب النشط

  await db.certificateTemplate.delete({ where: { id: templateId } });

  await logAudit({
    actor,
    action: "CERTIFICATE_TEMPLATE_DELETE",
    targetType: "CertificateTemplate",
    targetId: template.id,
    targetLabel: template.name,
    message: `حذفت قالب الشهادة "${template.name}"`,
  });

  revalidatePath("/certificates/template");
}
