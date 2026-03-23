import { Module } from '@nestjs/common';
import { EventRequestsService } from './event-requests.service';
import { EventRequestsController } from './event-requests.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EventRequestsController],
  providers: [EventRequestsService, PrismaService],
})
export class EventRequestsModule {}
