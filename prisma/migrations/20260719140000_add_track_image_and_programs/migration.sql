-- إضافة صورة اختيارية للمسار، وجدول البرامج (سجل الإنجازات)
ALTER TABLE "Track" ADD COLUMN "imageUrl" TEXT;

CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "reportUrl" TEXT,
    "reportFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);
