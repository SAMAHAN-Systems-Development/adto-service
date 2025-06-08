import { Module } from '@nestjs/common';
import { EventAnnouncementsService } from './event-announcements.service';
import { EventAnnouncementsController } from './event-announcements.controller';
import { EventsModule } from 'src/events/events.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [EventAnnouncementsController],
  providers: [EventAnnouncementsService],
  imports: [EventsModule, PrismaModule],
})
export class EventAnnouncementsModule {}
