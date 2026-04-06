-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isRsvpEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "hasRsvpd" BOOLEAN NOT NULL DEFAULT false;
