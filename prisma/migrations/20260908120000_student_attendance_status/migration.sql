-- تحويل StudentAttendance.present (Boolean) إلى status (Enum ثلاثي الحالة)، بنفس نمط هجرة 20260904091500_split_staff_absence_status
-- present=false تُنقل افتراضيًا إلى ABSENT_UNEXCUSED (لم يكن هناك تمييز بعذر/بدون عذر سابقًا)
BEGIN;
CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED');
ALTER TABLE "StudentAttendance" ADD COLUMN "status" "StudentAttendanceStatus";
UPDATE "StudentAttendance" SET "status" = CASE WHEN "present" THEN 'PRESENT' ELSE 'ABSENT_UNEXCUSED' END::"StudentAttendanceStatus";
ALTER TABLE "StudentAttendance" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "StudentAttendance" ALTER COLUMN "status" SET DEFAULT 'PRESENT';
ALTER TABLE "StudentAttendance" DROP COLUMN "present";
COMMIT;
