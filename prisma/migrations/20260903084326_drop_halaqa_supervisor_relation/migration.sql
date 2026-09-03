-- DropForeignKey
ALTER TABLE "Halaqa" DROP CONSTRAINT "Halaqa_supervisorId_fkey";

-- DropIndex
DROP INDEX "Halaqa_supervisorId_idx";

-- AlterTable
ALTER TABLE "Halaqa" DROP COLUMN "supervisorId";

