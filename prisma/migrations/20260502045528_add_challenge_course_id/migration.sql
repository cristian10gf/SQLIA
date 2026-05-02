/*
  Warnings:

  - Added the required column `course_id` to the `challenges` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "evaluation_challenges" DROP CONSTRAINT "evaluation_challenges_challenge_id_fkey";

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "course_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "idx_challenge_course" ON "challenges"("course_id");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_challenges" ADD CONSTRAINT "evaluation_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
