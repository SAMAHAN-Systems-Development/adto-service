import { Module } from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { TicketRequestsController } from './ticket-requests.controller';

@Module({
  controllers: [TicketRequestsController],
  providers: [TicketRequestsService],
})
export class TicketRequestsModule {}
