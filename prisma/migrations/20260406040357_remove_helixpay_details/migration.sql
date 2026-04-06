/*
  Warnings:

  - You are about to drop the column `helixpayPassword` on the `TicketRequests` table. All the data in the column will be lost.
  - You are about to drop the column `helixpayUsername` on the `TicketRequests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TicketRequests" DROP COLUMN "helixpayPassword",
DROP COLUMN "helixpayUsername";
