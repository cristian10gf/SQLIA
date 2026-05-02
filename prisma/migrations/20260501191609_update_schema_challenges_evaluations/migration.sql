/*
  Warnings:

  - You are about to drop the column `course_id` on the `challenges` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "challenges" DROP CONSTRAINT "challenges_course_id_fkey";

-- DropIndex
DROP INDEX "idx_challenge_course";

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "course_id";

-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "created_by" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "idx_evaluation_course" ON "evaluations"("course_id");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
