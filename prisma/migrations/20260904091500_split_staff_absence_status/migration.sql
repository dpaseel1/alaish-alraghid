-- AlterEnum: تقسيم "ABSENT" إلى "ABSENT_EXCUSED" (غياب بعذر) و"ABSENT_UNEXCUSED" (غياب بدون عذر)
-- السجلات القديمة بحالة ABSENT تُنقل افتراضيًا إلى ABSENT_UNEXCUSED
BEGIN;
CREATE TYPE "StaffAttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'LEAVE');
ALTER TABLE "StaffAttendance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StaffAttendance" ALTER COLUMN "status" TYPE "StaffAttendanceStatus_new" USING (
  CASE "status"::text
    WHEN 'ABSENT' THEN 'ABSENT_UNEXCUSED'
    ELSE "status"::text
  END::"StaffAttendanceStatus_new"
);
ALTER TYPE "StaffAttendanceStatus" RENAME TO "StaffAttendanceStatus_old";
ALTER TYPE "StaffAttendanceStatus_new" RENAME TO "StaffAttendanceStatus";
DROP TYPE "StaffAttendanceStatus_old";
ALTER TABLE "StaffAttendance" ALTER COLUMN "status" SET DEFAULT 'PRESENT';
COMMIT;
