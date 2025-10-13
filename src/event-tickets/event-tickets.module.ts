import { Module } from '@nestjs/common';
import { EventTicketsService } from './event-tickets.service';
import { EventTicketsController } from './event-tickets.controller';

@Module({
  controllers: [EventTicketsController],
  providers: [EventTicketsService],
})
export class EventTicketsModule {}
