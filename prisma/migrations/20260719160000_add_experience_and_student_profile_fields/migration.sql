-- إضافة حقل الخبرة للمعلمة/المشرفة + بيانات إضافية مطلوبة للطالبة (رقم الهوية مشفّر، العمر، المؤهل، مقر الإقامة، مقدار الحفظ)

ALTER TABLE "User" ADD COLUMN "experience" TEXT;

ALTER TABLE "Student" ADD COLUMN "nationalIdEncrypted" TEXT;
ALTER TABLE "Student" ADD COLUMN "nationalIdLastFour" TEXT;
ALTER TABLE "Student" ADD COLUMN "age" INTEGER;
ALTER TABLE "Student" ADD COLUMN "educationLevel" TEXT;
ALTER TABLE "Student" ADD COLUMN "residence" TEXT;
ALTER TABLE "Student" ADD COLUMN "memorizedAmount" TEXT;
