-- CreateTable: Track
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Track_name_key" ON "Track"("name");

-- AlterTable: Halaqa - add trackId
ALTER TABLE "Halaqa" ADD COLUMN "trackId" TEXT;

CREATE INDEX "Halaqa_trackId_idx" ON "Halaqa"("trackId");

ALTER TABLE "Halaqa" ADD CONSTRAINT "Halaqa_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: User - add teacher profile fields
ALTER TABLE "User" ADD COLUMN "nationality" TEXT;
ALTER TABLE "User" ADD COLUMN "age" INTEGER;
ALTER TABLE "User" ADD COLUMN "educationLevel" TEXT;
ALTER TABLE "User" ADD COLUMN "residence" TEXT;
ALTER TABLE "User" ADD COLUMN "memorizedAmount" TEXT;
