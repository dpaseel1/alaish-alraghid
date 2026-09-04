-- AlterTable
ALTER TABLE "AttendanceLog" DROP COLUMN "hasRecitation";

-- AlterTable
ALTER TABLE "StudentAttendance" DROP COLUMN "recited",
DROP COLUMN "reviewPagesRecorded";

-- CreateTable
CREATE TABLE "WeeklyRecitation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "recited" BOOLEAN NOT NULL DEFAULT false,
    "pagesRecorded" INTEGER NOT NULL DEFAULT 0,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyRecitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyRecitation_weekStart_idx" ON "WeeklyRecitation"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyRecitation_studentId_weekStart_key" ON "WeeklyRecitation"("studentId", "weekStart");

-- AddForeignKey
ALTER TABLE "WeeklyRecitation" ADD CONSTRAINT "WeeklyRecitation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
