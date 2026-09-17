-- AlterTable
ALTER TABLE "MemorizationRecord" ADD COLUMN     "pagesReviewed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "volunteerHoursAdjustment" INTEGER NOT NULL DEFAULT 0;
