-- AlterTable
ALTER TABLE "Halaqa" ADD COLUMN     "days" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "supervisorName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supervisedTrackId" TEXT;

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundUrl" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateTemplate_isActive_idx" ON "CertificateTemplate"("isActive");

-- CreateIndex
CREATE INDEX "User_supervisedTrackId_idx" ON "User"("supervisedTrackId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisedTrackId_fkey" FOREIGN KEY ("supervisedTrackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;
