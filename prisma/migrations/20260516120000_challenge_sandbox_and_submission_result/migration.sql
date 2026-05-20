-- CreateEnum
CREATE TYPE "ChallengeSandboxStatus" AS ENUM ('PENDING', 'PROVISIONING', 'READY', 'ERROR', 'EXPIRED');

-- CreateTable
CREATE TABLE "challenge_sandboxes" (
    "id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "status" "ChallengeSandboxStatus" NOT NULL DEFAULT 'PENDING',
    "docker_container_name" TEXT,
    "host_port" INTEGER,
    "db_user" TEXT,
    "db_password" TEXT,
    "db_name" TEXT,
    "connection_host" TEXT,
    "expires_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_sandboxes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "challenge_sandboxes_challenge_id_key" ON "challenge_sandboxes"("challenge_id");

-- CreateIndex
CREATE INDEX "idx_challenge_sandbox_status" ON "challenge_sandboxes"("status");

-- AddForeignKey
ALTER TABLE "challenge_sandboxes" ADD CONSTRAINT "challenge_sandboxes_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "result_json" JSONB;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
