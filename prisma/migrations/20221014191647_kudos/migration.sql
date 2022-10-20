-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kudos" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "KudosTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "TransactionStatus" NOT NULL DEFAULT 'Pending',
    "amount" INTEGER NOT NULL,
    "senderId" UUID,
    "recipientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "KudosTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KudosTransaction" ADD CONSTRAINT "KudosTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudosTransaction" ADD CONSTRAINT "KudosTransaction_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
