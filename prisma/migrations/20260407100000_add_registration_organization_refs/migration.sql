-- AlterTable
ALTER TABLE "Registration"
ADD COLUMN     "organizationParentId" TEXT,
ADD COLUMN     "organizationChildId" TEXT;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_organizationParentId_fkey"
FOREIGN KEY ("organizationParentId") REFERENCES "OrganizationParent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_organizationChildId_fkey"
FOREIGN KEY ("organizationChildId") REFERENCES "OrganizationChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
