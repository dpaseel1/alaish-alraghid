-- إضافة جدول إعدادات الموقع العامة (صف وحيد) لتخزين شعار الموقع القابل للتعديل
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
