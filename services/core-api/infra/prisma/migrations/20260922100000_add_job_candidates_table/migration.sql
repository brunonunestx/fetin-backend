-- CreateEnum
CREATE TYPE "job_candidate_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "job_candidates" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "operatorId" UUID NOT NULL,
    "status" "job_candidate_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_candidates_jobId_idx" ON "job_candidates"("jobId");

-- CreateIndex
CREATE INDEX "job_candidates_operatorId_idx" ON "job_candidates"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "job_candidates_jobId_operatorId_key" ON "job_candidates"("jobId", "operatorId");
