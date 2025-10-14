import { Module } from '@nestjs/common';
import { EventTicketsService } from './event-tickets.service';
import { EventTicketsController } from './event-tickets.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [EventTicketsController],
  providers: [EventTicketsService],
  imports: [PrismaModule],
})
export class EventTicketsModule {}
