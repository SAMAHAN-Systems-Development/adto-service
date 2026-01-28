/*
  Warnings:

  - You are about to drop the `PortalRequests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PortalRequests" DROP CONSTRAINT "PortalRequests_eventId_fkey";

-- DropTable
DROP TABLE "PortalRequests";

-- CreateTable
CREATE TABLE "TicketRequests" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "ticketLink" TEXT,

    CONSTRAINT "TicketRequests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketRequests_ticketId_orgId_key" ON "TicketRequests"("ticketId", "orgId");

-- AddForeignKey
ALTER TABLE "TicketRequests" ADD CONSTRAINT "TicketRequests_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TicketCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketRequests" ADD CONSTRAINT "TicketRequests_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "OrganizationChild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
