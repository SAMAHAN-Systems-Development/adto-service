import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { PrismaModule } from 'src/prisma/prisma.module'; 


@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  imports: [SupabaseModule, PrismaModule],
  exports: [OrganizationsService],

})
export class OrganizationsModule {}
