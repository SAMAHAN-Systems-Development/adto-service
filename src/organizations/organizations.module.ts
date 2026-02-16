import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { S3Module } from 'src/s3/s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  imports: [S3Module, PrismaModule, UsersModule],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
