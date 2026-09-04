-- AlterTable
ALTER TABLE "Halaqa" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- تعبئة ترتيب تسلسلي مبدئي حسب تاريخ الإنشاء، بدل أن يبقى الجميع على 0
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) - 1 AS "rn"
  FROM "Halaqa"
)
UPDATE "Halaqa"
SET "order" = "ordered"."rn"
FROM "ordered"
WHERE "Halaqa"."id" = "ordered"."id";
