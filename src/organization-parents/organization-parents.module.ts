import { Module } from '@nestjs/common';
import { OrganizationParentsService } from './organization-parents.service';
import { OrganizationParentsController } from './organization-parents.controller';

@Module({
  controllers: [OrganizationParentsController],
  providers: [OrganizationParentsService],
})
export class OrganizationParentsModule {}
