-- CreateTable
CREATE TABLE "locals" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locals_ownerId_idx" ON "locals"("ownerId");
