-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "isRsvpEnabled" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Registration" ALTER COLUMN "hasRsvpd" DROP NOT NULL;
