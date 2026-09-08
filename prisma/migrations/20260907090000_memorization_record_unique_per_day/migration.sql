-- Merge any existing duplicate MemorizationRecord rows sharing the same
-- (studentId, date) before enforcing the new unique constraint below.
-- Keeps the most recently created row per group, summing pagesMemorized
-- (so Student.memorizedPagesTotal, which was incremented per row, stays
-- correct) and preserving the latest non-null quota.
WITH grouped AS (
  SELECT
    "studentId",
    "date",
    (ARRAY_AGG("id" ORDER BY "createdAt" DESC))[1] AS keep_id,
    SUM("pagesMemorized") AS total_pages,
    (ARRAY_AGG("quota" ORDER BY ("quota" IS NOT NULL) DESC, "createdAt" DESC))[1] AS latest_quota
  FROM "MemorizationRecord"
  GROUP BY "studentId", "date"
  HAVING COUNT(*) > 1
)
UPDATE "MemorizationRecord" m
SET "pagesMemorized" = g.total_pages,
    "quota" = g.latest_quota
FROM grouped g
WHERE m."id" = g.keep_id;

WITH grouped AS (
  SELECT
    "studentId",
    "date",
    (ARRAY_AGG("id" ORDER BY "createdAt" DESC))[1] AS keep_id
  FROM "MemorizationRecord"
  GROUP BY "studentId", "date"
  HAVING COUNT(*) > 1
)
DELETE FROM "MemorizationRecord" m
USING grouped g
WHERE m."studentId" = g."studentId"
  AND m."date" = g."date"
  AND m."id" <> g.keep_id;

-- Replace the old non-unique index with a unique constraint
DROP INDEX "MemorizationRecord_studentId_date_idx";

CREATE UNIQUE INDEX "MemorizationRecord_studentId_date_key" ON "MemorizationRecord"("studentId", "date");
