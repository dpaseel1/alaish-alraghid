-- AlterTable
ALTER TABLE "AttendanceLog" ADD COLUMN     "hasRecitation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Halaqa" ADD COLUMN     "recitationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "reviewedPagesTotal" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StudentAttendance" ADD COLUMN     "recited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewPagesRecorded" INTEGER NOT NULL DEFAULT 0;
