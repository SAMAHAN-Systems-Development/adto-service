-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'CANCELLED');

-- CreateTable
CREATE TABLE "EventAnnouncements" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "announcementType" "AnnouncementType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAnnouncements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventAnnouncements" ADD CONSTRAINT "EventAnnouncements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
