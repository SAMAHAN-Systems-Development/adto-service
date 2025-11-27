-- CreateTable
CREATE TABLE "PortalRequests" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "portalLink" TEXT,

    CONSTRAINT "PortalRequests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PortalRequests" ADD CONSTRAINT "PortalRequests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
