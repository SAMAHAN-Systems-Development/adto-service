import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsService } from 'src/events/events.service';
import { Prisma, UserType } from '@prisma/client';


@Injectable()
export class EventAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private eventService: EventsService,
  ) {}
  async create(createEventAnnouncementDto: CreateEventAnnouncementDto, user: any) {
    const { eventId, ...announcementDetails } = createEventAnnouncementDto;

      console.log('User info:', {
      role: user.role,
      orgId: user.orgId,
      email: user.email
    });



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

      // Superadmins (UserType.ADMIN) have read-only access
      if (user.role === UserType.ADMIN) {
        throw new HttpException(
          'Superadmins have read-only access to announcements',
          HttpStatus.FORBIDDEN,
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

  }

  async findAllByEvent(eventId: string, user: any) {
    try {
      const event = await this.eventService.findOne(eventId);

      if (!event) {
        throw new HttpException(
          `Event with id ${eventId} not found`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.role === UserType.ORGANIZATION && event.orgId !== user.orgId) {
        throw new HttpException(
          `You can only view announcements for your organization events`,
          HttpStatus.FORBIDDEN,
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
    user: any;
  }) {
    const { eventId, organizationId, user } = filters;

    try {
      const where: any = {};

      // Add filters
      if (eventId) {
        where.eventId = eventId;
      }

      if (organizationId) {
        where.event = {
          orgId: organizationId,
        };
      }

      // Role-based filtering
      if (user.role === UserType.ORGANIZATION) {
        where.event = {
          ...where.event,
          orgId: user.orgId,
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

  async findOne(id: string, user: any) {
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

      // Check access rights
      if (user.role === UserType.ORGANIZATION && announcement.event.orgId !== user.orgId) {
        throw new HttpException(
          'You can only view announcements for your organization events',
          HttpStatus.FORBIDDEN,
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
    user: any,
  ) {
    try {
        // Superadmins have read-only access
      if (user.role === UserType.ADMIN) {
        throw new HttpException(
          'Superadmins have read-only access to announcements',
          HttpStatus.FORBIDDEN,
        );
      }

      //Check if announcement exists and user has access
      const existingAnnouncement = await this.findOne(id, user);

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


  async remove(id: string, user: any) {
    try {

        // Superadmins have read-only access
      if (user.role === UserType.ADMIN) {
        throw new HttpException(
          'Superadmins have read-only access to announcements',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if announcement exists and user has access
      await this.findOne(id, user);

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