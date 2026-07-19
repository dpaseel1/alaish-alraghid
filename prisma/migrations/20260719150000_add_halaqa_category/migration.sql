-- إضافة تصنيف اختياري للحلقة (أمهات / فتيات / أطفال)
CREATE TYPE "HalaqaCategory" AS ENUM ('MOTHERS', 'GIRLS', 'CHILDREN');

ALTER TABLE "Halaqa" ADD COLUMN "category" "HalaqaCategory";
