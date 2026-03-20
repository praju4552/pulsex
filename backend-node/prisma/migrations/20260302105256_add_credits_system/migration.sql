-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'DEDUCTION');

-- AlterTable
ALTER TABLE "ProjectTemplate" ADD COLUMN     "contentCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imageCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProjectCreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectCreditTransaction" ADD CONSTRAINT "ProjectCreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCreditTransaction" ADD CONSTRAINT "ProjectCreditTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
