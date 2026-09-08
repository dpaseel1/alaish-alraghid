-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('HIFZ', 'MURAJAA', 'TILAWAH', 'TAFSIR');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN "type" "TrackType" NOT NULL DEFAULT 'HIFZ';
