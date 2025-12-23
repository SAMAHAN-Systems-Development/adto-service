/*
  Warnings:

  - You are about to drop the column `bookerId` on the `Registration` table. All the data in the column will be lost.
  - You are about to drop the `Booker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cluster` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `course` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearLevel` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booker" DROP CONSTRAINT "Booker_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Booker" DROP CONSTRAINT "Booker_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_bookerId_fkey";

-- AlterTable
ALTER TABLE "Registration" DROP COLUMN "bookerId",
ADD COLUMN     "cluster" TEXT NOT NULL,
ADD COLUMN     "course" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "yearLevel" TEXT NOT NULL;

-- DropTable
DROP TABLE "Booker";

-- DropTable
DROP TABLE "Course";

-- DropTable
DROP TABLE "Payment";
