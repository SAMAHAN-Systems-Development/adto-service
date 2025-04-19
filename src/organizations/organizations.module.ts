import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  imports: [SupabaseModule],
})
export class OrganizationsModule {}
