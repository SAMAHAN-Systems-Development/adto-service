import { Module } from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { TicketRequestsController } from './ticket-requests.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TicketRequestsController],
  providers: [TicketRequestsService, PrismaService],
  exports: [TicketRequestsService],
})
export class TicketRequestsModule {}
