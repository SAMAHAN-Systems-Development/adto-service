/*
  Warnings:

  - You are about to drop the `FormAnswers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormQuestionChoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormQuestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FormAnswers" DROP CONSTRAINT "FormAnswers_formQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "FormAnswers" DROP CONSTRAINT "FormAnswers_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "FormQuestionChoices" DROP CONSTRAINT "FormQuestionChoices_formQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "FormQuestions" DROP CONSTRAINT "FormQuestions_eventId_fkey";

-- DropTable
DROP TABLE "FormAnswers";

-- DropTable
DROP TABLE "FormQuestionChoices";

-- DropTable
DROP TABLE "FormQuestions";

-- DropEnum
DROP TYPE "FormElements";
