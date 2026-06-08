-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'trucker');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'trucker',
    "truckerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_truckerId_key" ON "User"("truckerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_truckerId_fkey" FOREIGN KEY ("truckerId") REFERENCES "Trucker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
