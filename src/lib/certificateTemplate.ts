import "server-only";
import { db } from "@/lib/db";
import type { CertificateLayout } from "@/lib/certificateRender";

export async function getActiveCertificateTemplate(): Promise<{
  backgroundUrl: string;
  layout: CertificateLayout;
} | null> {
  const template = await db.certificateTemplate.findFirst({ where: { isActive: true } });
  if (!template) return null;
  return { backgroundUrl: template.backgroundUrl, layout: template.layout as unknown as CertificateLayout };
}
