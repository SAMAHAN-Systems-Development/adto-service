import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
      throw new HttpException(
        'Event ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const event = await this.eventsService.findOne(eventId)

      if (!event) {
        throw new HttpException(
          `Event with id ${eventId} not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.role === UserType.ORGANIZATION && event.orgId !== user.orgId) {
        throw new HttpException(
          `You can only create announcements for your organization events`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const eventAnnouncement = await this.prisma.eventAnnouncements.create({
        data: {
          ...announcementDetails,
          event: {
            connect: { id: eventId },
          },
        },
        include: {
          event: {
            include: {
              org: true,
            },
          },
        },
      });


      return {
        message: 'Event announcement created successfully',
        data: eventAnnouncement,
        statusCode: HttpStatus.CREATED,
      };

    } catch (error) {
      if (error instanceof HttpException) {
            throw error;
      }

      throw new HttpException(
        `Failed to create event announcement`,
        HttpStatus.BAD_REQUEST,
      );
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
