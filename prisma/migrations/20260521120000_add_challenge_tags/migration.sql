-- AlterTable
ALTER TABLE "challenges" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
