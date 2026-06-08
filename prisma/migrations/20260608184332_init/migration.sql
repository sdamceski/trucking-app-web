-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('new', 'assigned', 'picked_up', 'delivered');

-- CreateTable
CREATE TABLE "Trucker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "truckNumber" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perLoadFees" JSONB NOT NULL DEFAULT '[]',
    "recurringFees" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trucker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "status" "LoadStatus" NOT NULL,
    "pickupDate" TEXT NOT NULL DEFAULT '',
    "deliveryDate" TEXT NOT NULL DEFAULT '',
    "truckerId" TEXT,
    "originCompany" TEXT NOT NULL DEFAULT '',
    "originAddress" TEXT NOT NULL DEFAULT '',
    "destinationCompany" TEXT NOT NULL DEFAULT '',
    "destinationAddress" TEXT NOT NULL DEFAULT '',
    "loadPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "truckerRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reference" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "invoicedAt" TEXT NOT NULL DEFAULT '',
    "invoicedNote" TEXT NOT NULL DEFAULT '',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT NOT NULL DEFAULT '',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "payoutSnapshot" JSONB,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "truckerId" TEXT NOT NULL,
    "truckerName" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL DEFAULT '',
    "periodEnd" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "loadLines" JSONB NOT NULL DEFAULT '[]',
    "recurringLines" JSONB NOT NULL DEFAULT '[]',
    "loadsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recurringTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Load_truckerId_idx" ON "Load"("truckerId");

-- CreateIndex
CREATE INDEX "Load_payoutId_idx" ON "Load"("payoutId");

-- CreateIndex
CREATE INDEX "Load_status_idx" ON "Load"("status");

-- CreateIndex
CREATE INDEX "Payout_truckerId_idx" ON "Payout"("truckerId");

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_truckerId_fkey" FOREIGN KEY ("truckerId") REFERENCES "Trucker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_truckerId_fkey" FOREIGN KEY ("truckerId") REFERENCES "Trucker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
