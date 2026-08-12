-- CreateTable
CREATE TABLE "job_subscriptions" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "operatorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "job_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_subscriptions_jobId_key" ON "job_subscriptions"("jobId");

-- CreateIndex
CREATE INDEX "job_subscriptions_operatorId_idx" ON "job_subscriptions"("operatorId");
