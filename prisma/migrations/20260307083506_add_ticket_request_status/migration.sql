/*
  Warnings:

  - You are about to drop the column `isApproved` on the `TicketRequests` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- DropIndex
DROP INDEX "TicketRequests_ticketId_orgId_key";

-- AlterTable
ALTER TABLE "TicketRequests" DROP COLUMN "isApproved",
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "status" "TicketRequestStatus" NOT NULL DEFAULT 'PENDING';
