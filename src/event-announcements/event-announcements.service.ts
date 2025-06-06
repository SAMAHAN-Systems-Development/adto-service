import { Injectable } from '@nestjs/common';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class EventAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private eventService: EventsService,
  ) {}
  async create(createEventAnnouncementDto: CreateEventAnnouncementDto) {
    const { eventId, ...announcementDetails } = createEventAnnouncementDto;
    if (!eventId) {
      throw new Error('Event ID is required to create an announcement');
    }

    const event = await this.eventService.findOne(eventId);

    if (!event) {
      throw new Error(`Event with id ${eventId} not found`);
    }

    const eventAnnouncement = await this.prisma.eventAnnouncements.create({
      data: {
        ...announcementDetails,
        event: {
          connect: { id: eventId },
        },
      },
    });

    if (!eventAnnouncement) {
      throw new Error('Failed to create event announcement');
    }

    return eventAnnouncement;
  }

  async findAllByEvent(eventId: string) {
    const eventAnnouncements = await this.prisma.eventAnnouncements.findMany({
      where: { eventId },
    });

    if (!eventAnnouncements) {
      throw new Error('No event announcements found for this event');
    }

    return eventAnnouncements;
  }

  async findAll() {
    const eventAnnouncements = this.prisma.eventAnnouncements.findMany();

    if (!eventAnnouncements) {
      throw new Error('No event announcements found');
    }

    return eventAnnouncements;
  }

  async findOne(id: string) {
    const eventAnnouncement = this.prisma.eventAnnouncements.findUnique({
      where: { id },
    });

    if (!eventAnnouncement) {
      throw new Error(`Event announcement with id ${id} not found`);
    }

    return eventAnnouncement;
  }

  async update(
    id: string,
    updateEventAnnouncementDto: UpdateEventAnnouncementDto,
  ) {
    const updatedEventAnnouncement = this.prisma.eventAnnouncements.update({
      where: { id },
      data: updateEventAnnouncementDto,
    });

    if (!updatedEventAnnouncement) {
      throw new Error(`Failed to update event announcement with id ${id}`);
    }

    return updatedEventAnnouncement;
  }

  async remove(id: string) {
    const deletedEventAnnouncement = this.prisma.eventAnnouncements.delete({
      where: { id },
    });

    if (!deletedEventAnnouncement) {
      throw new Error(`Failed to delete event announcement with id ${id}`);
    }

    return deletedEventAnnouncement;
  }
}
