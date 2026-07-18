"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export type TrackActionState = { error?: string; success?: string };

const trackSchema = z.object({
  name: z.string().trim().min(2, "اسم المسار قصير جدًا").max(100, "اسم المسار طويل جدًا"),
});

export async function createTrackAction(
  _prev: TrackActionState | undefined,
  formData: FormData
): Promise<TrackActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = trackSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existing = await db.track.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "يوجد مسار آخر بنفس الاسم" };

  const track = await db.track.create({ data: { name: parsed.data.name } });

  await logAudit({
    actor,
    action: "TRACK_CREATE",
    targetType: "Track",
    targetId: track.id,
    targetLabel: track.name,
    message: `أنشأت مسارًا جديدًا "${track.name}"`,
  });

  revalidatePath("/");
  redirect(`/tracks/${track.id}`);
}

export async function updateTrackAction(
  trackId: string,
  _prev: TrackActionState | undefined,
  formData: FormData
): Promise<TrackActionState> {
  const actor = await requireRole("ADMIN");

  const parsed = trackSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const track = await db.track.findUnique({ where: { id: trackId } });
  if (!track) return { error: "المسار غير موجود" };

  const existing = await db.track.findUnique({ where: { name: parsed.data.name } });
  if (existing && existing.id !== trackId) return { error: "يوجد مسار آخر بنفس الاسم" };

  await db.track.update({ where: { id: trackId }, data: { name: parsed.data.name } });

  await logAudit({
    actor,
    action: "TRACK_UPDATE",
    targetType: "Track",
    targetId: trackId,
    targetLabel: parsed.data.name,
    message: `عدّلت اسم المسار من "${track.name}" إلى "${parsed.data.name}"`,
  });

  revalidatePath("/");
  revalidatePath(`/tracks/${trackId}`);
  redirect(`/tracks/${trackId}`);
}

export async function deleteTrackAction(trackId: string) {
  const actor = await requireRole("ADMIN");

  const track = await db.track.findUnique({ where: { id: trackId } });
  if (!track) return;

  // الحلقات المرتبطة بهذا المسار تبقى موجودة، فقط يُفصَل ارتباطها بالمسار (ON DELETE SET NULL)
  await db.track.delete({ where: { id: trackId } });

  await logAudit({
    actor,
    action: "TRACK_DELETE",
    targetType: "Track",
    targetId: trackId,
    targetLabel: track.name,
    message: `حذفت المسار "${track.name}"`,
  });

  revalidatePath("/");
  revalidatePath(`/tracks/${trackId}`);
  redirect("/");
}
