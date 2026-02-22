-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'PODCAST';
ALTER TYPE "ContentType" ADD VALUE 'VISUAL';
ALTER TYPE "ContentType" ADD VALUE 'VIDEO';
ALTER TYPE "ContentType" ADD VALUE 'INTERACTIVE';

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "outputModes" JSONB NOT NULL DEFAULT '[]';
