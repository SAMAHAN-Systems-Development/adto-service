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
      const event = await this.eventService.findOne(eventId)

        console.log('Event info:', {
        id: event.id,
        name: event.name,
        orgId: event.orgId
      });

      if (!event) {
        throw new HttpException(
          `Event with id ${eventId} not found`,
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

  }

  async findAllByEvent(eventId: string) {
    try {
      const event = await this.eventService.findOne(eventId);

      if (!event) {
        throw new HttpException(
          `Event with id ${eventId} not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const announcements = await this.prisma.eventAnnouncements.findMany({
        where: { eventId },
        include: {
          event: {
            include: {
              org: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Event announcements fetched successfully',
        data: announcements,
        statusCode: HttpStatus.OK,
      };

    }catch (error){
      if (error instanceof HttpException) {
          throw error;
      }

      throw new HttpException(
        `Failed to fetch event announcements`,
        HttpStatus.BAD_REQUEST,
      );
    }

  }

  async findAll(filters: {
    eventId?: string;
    organizationId?: string;
  }) {
    const { eventId, organizationId} = filters;

    try {
      const where: any = {};

      if (eventId) {
        where.eventId = eventId;
      }

      if (organizationId) {
        where.event = {
          orgId: organizationId,
        };
      }

      const announcements = await this.prisma.eventAnnouncements.findMany({
        where,
        include: {
          event: {
            include: {
              org: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        message: 'Event announcements fetched successfully',
        data: announcements,
        statusCode: HttpStatus.OK,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to fetch event announcements`,
        HttpStatus.BAD_REQUEST,
      );
    }

  }

  async findOne(id: string) {
    try {
      const announcement = await this.prisma.eventAnnouncements.findUnique({
        where: { id },
        include: {
          event: {
            include: {
              org: true,
            },
          },
        },
      });

      if (!announcement) {
        throw new HttpException(
          `Event announcement with id ${id} not found`, 
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Event announcement fetched successfully',
        data: announcement,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to fetch event announcement`,
        HttpStatus.BAD_REQUEST,
      );
    }

  }

  async update(
    id: string,
    updateEventAnnouncementDto: UpdateEventAnnouncementDto,
  ) {
    try {

      //Check if announcement exists and user has access
      const existingAnnouncement = await this.findOne(id);

      const updatedAnnouncement = await this.prisma.eventAnnouncements.update({
        where: { id },
        data: updateEventAnnouncementDto,
        include: {
          event: {
            include: {
              org: true,
            },
          },
        },
      });

      return {
        message: 'Event announcement updated successfully',
        data: updatedAnnouncement,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
          }
      throw new HttpException(
          `Failed to fetch event announcement`,
           HttpStatus.BAD_REQUEST,
          );
      }
  }


  async remove(id: string) {
    try {

      await this.findOne(id);

      await this.prisma.eventAnnouncements.delete({
        where: { id },
      });

      return {
        message: 'Event announcement deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete event announcement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}