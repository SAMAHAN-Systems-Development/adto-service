import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserType } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { S3Service } from '../s3/s3.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async create(createEventDto: CreateEventDto, orgId: string) {
    const dateStart = new Date(createEventDto.dateStart);
    const dateEnd = new Date(createEventDto.dateEnd);
    const now = new Date();

    if (Number.isNaN(dateStart.getTime()) || Number.isNaN(dateEnd.getTime())) {
      throw new BadRequestException('Invalid start or end date format.');
    }

    if (dateStart < now) {
      throw new BadRequestException('Start date/time cannot be in the past.');
    }

    if (dateEnd <= dateStart) {
      throw new BadRequestException(
        'End date/time must be after start date/time.',
      );
    }

    const createdEvent = await this.prisma.event.create({
      data: {
        ...createEventDto,
        dateStart,
        dateEnd,
        org: {
          connect: {
            id: orgId,
          },
        },
      },
    });

    if (createdEvent instanceof Error) {
      throw new HttpException(
        'Event could not be created',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Event created successfully',
      data: createdEvent,
    };
  }

  async findAll(
    role: UserType | null,
    orgId: string | null,
    query: {
      page?: number;
      limit?: number;
      isRegistrationOpen?: boolean;
      isRegistrationRequired?: boolean;
      isOpenToOutsiders?: boolean;
      searchFilter?: string;
      organizationId?: string;
      organizationParentId?: string;
      orderBy?: 'asc' | 'desc';
      price?: 'free' | 'paid' | 'all';
      eventStatus?: 'DRAFT' | 'UPCOMING' | 'FINISHED' | 'ARCHIVED';
    },
  ) {
    const {
      page = 1,
      limit = 10,
      isRegistrationOpen,
      isRegistrationRequired,
      isOpenToOutsiders,
      searchFilter,
      organizationId,
      organizationParentId,
      orderBy = 'asc',
      price,
      eventStatus,
    } = query;

    const skip = (page - 1) * limit;

    // Build eventStatus-based where clause
    const eventStatusWhere: Prisma.EventWhereInput = (() => {
      switch (eventStatus) {
        case 'DRAFT':
          return { isPublished: false };
        case 'UPCOMING':
          return { isPublished: true, dateEnd: { gt: new Date() } };
        case 'FINISHED':
          return { isPublished: true, dateEnd: { lte: new Date() } };
        case 'ARCHIVED':
          return { isArchived: true };
        default:
          return {};
      }
    })();

    const where: Prisma.EventWhereInput = {
      ...(isRegistrationOpen && { isRegistrationOpen }),
      ...(isRegistrationRequired && { isRegistrationRequired }),
      ...(isOpenToOutsiders && { isOpenToOutsiders }),
      ...(role === UserType.ORGANIZATION
        ? { orgId: orgId || 'FORBIDDEN' }
        : organizationId
          ? { orgId: organizationId }
          : {}),
      ...(organizationParentId && {
        org: {
          organizationParents: {
            some: {
              organizationParentId: organizationParentId,
            },
          },
        },
      }),
      ...(searchFilter && {
        OR: [
          { name: { contains: searchFilter, mode: 'insensitive' } },
          { description: { contains: searchFilter, mode: 'insensitive' } },
          { org: { name: { contains: searchFilter, mode: 'insensitive' } } },
          { org: { acronym: { contains: searchFilter, mode: 'insensitive' } } },
        ],
      }),
      ...(price &&
        price !== 'all' && {
          TicketCategories: {
            ...(price === 'free' && {
              some: {
                price: 0,
              },
            }),
            ...(price === 'paid' && {
              some: {
                price: {
                  gt: 0,
                },
              },
            }),
          },
        }),
      ...eventStatusWhere,
      ...(role !== UserType.ADMIN &&
        role !== UserType.ORGANIZATION && { isPublished: true }),
      deletedAt: null,
      ...(eventStatus !== 'ARCHIVED' && { isArchived: false }),
    };

    const events = await this.prisma.event.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        dateStart: orderBy,
      },
      include: {
        org: true,
        TicketCategories: true,
        eventAnnouncements: {
          select: {
            title: true,
            content: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    const totalCount = await this.prisma.event.count({ where });

    const eventsWithRegistrants = await Promise.all(
      events.map(async (event) => {
        const registrantCount = await this.prisma.registration.count({
          where: {
            ticketCategory: {
              eventId: event.id,
            },
          },
        });

        return {
          ...event,
          totalRegistrants: registrantCount,
        };
      }),
    );

    return {
      data: eventsWithRegistrants,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          id,
        },
        include: {
          org: true,

          TicketCategories: true,
          eventAnnouncements: {
            select: {
              title: true,
              content: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      return event;
    } catch (error) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    await this.findOne(id);

    try {
      if (updateEventDto.isPublished) {
        const approvedRequest = await this.prisma.eventRequest.findFirst({
          where: { eventId: id, status: 'APPROVED' },
        });
        if (!approvedRequest) {
          throw new BadRequestException(
            'Event must have an approved concept paper request before publishing',
          );
        }
      }

      const updatedEvent = await this.prisma.event.update({
        where: {
          id,
        },
        data: {
          ...updateEventDto,
          // Convert date strings to Date objects if they exist
          ...(updateEventDto.dateStart && {
            dateStart: new Date(updateEventDto.dateStart),
          }),
          ...(updateEventDto.dateEnd && {
            dateEnd: new Date(updateEventDto.dateEnd),
          }),
        },
        include: {
          org: true,
        },
      });

      return {
        message: 'Event updated successfully',
        data: updatedEvent,
      };
    } catch (error) {
      throw new HttpException(
        'Event could not be updated',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async publishEvent(id: string) {
    await this.findOne(id);

    // Check for approved event request
    const approvedRequest = await this.prisma.eventRequest.findFirst({
      where: {
        eventId: id,
        status: 'APPROVED',
      },
    });

    if (!approvedRequest) {
      throw new BadRequestException(
        'Event must have an approved concept paper request before publishing',
      );
    }

    try {
      const publishedEvent = await this.prisma.event.update({
        where: {
          id,
        },
        data: {
          isPublished: true,
        },
      });

      return {
        message: 'Event published successfully',
        data: publishedEvent,
      };
    } catch (error) {
      throw new HttpException(
        'Event could not be published',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async softDelete(id: string) {
    await this.findOne(id);
    try {
      const deletedEvent = await this.prisma.event.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        message: 'Event deleted successfully',
        data: deletedEvent,
      };
    } catch (error) {
      throw new HttpException(
        'Event could not be deleted',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async archive(id: string) {
    await this.findOne(id);

    const registrationCount = await this.prisma.registration.count({
      where: {
        ticketCategory: {
          eventId: id,
        },
      },
    });

    if (registrationCount > 0) {
      throw new BadRequestException(
        'Event cannot be archived because it has registered participants',
      );
    }

    try {
      return {
        message: 'Event archived successfully',
        data: await this.prisma.event.update({
          where: { id },
          data: { isArchived: true },
        }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Event not found', {
          cause: error,
          description: 'Id does not exist',
        });
      }
      throw new InternalServerErrorException('Event could not be archived', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async unarchive(id: string) {
    await this.findOne(id);
    try {
      return {
        message: 'Event unarchived successfully',
        data: await this.prisma.event.update({
          where: { id },
          data: {
            isArchived: false,
            isPublished: false,
          },
        }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Event not found', {
          cause: error,
          description: 'Id does not exist',
        });
      }
      throw new InternalServerErrorException('Event could not be unarchived', {
        cause: error,
        description: 'An unexpected error occurred',
      });
    }
  }

  async uploadConceptPaper(id: string, file: Express.Multer.File, user: any) {
    const event = await this.findOne(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (user.role === UserType.ORGANIZATION && event.orgId !== user.orgId) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    // Delete existing concept paper if exists
    if (event.conceptPaperPath) {
      try {
        await this.s3Service.deleteFile(
          event.conceptPaperPath,
          process.env.UPLOADS_BUCKET || 'uploads',
        );
      } catch (e) {
        console.error('Failed to delete old concept paper', e);
      }
    }

    // Upload new concept paper
    const bucketName = process.env.UPLOADS_BUCKET || 'uploads';
    const uploadResult = await this.s3Service.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      folder: 'concept-papers',
      contentType: file.mimetype,
      bucketName,
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        conceptPaperUrl: uploadResult.url,
        conceptPaperPath: uploadResult.key,
      },
      include: { org: true },
    });

    return {
      message: 'Concept paper uploaded successfully',
      data: updatedEvent,
    };
  }

  async deleteConceptPaper(id: string, user: any) {
    const event = await this.findOne(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (user.role === UserType.ORGANIZATION && event.orgId !== user.orgId) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (!event.conceptPaperPath) {
      throw new BadRequestException('No concept paper found to delete');
    }

    try {
      await this.s3Service.deleteFile(
        event.conceptPaperPath,
        process.env.UPLOADS_BUCKET || 'uploads',
      );
    } catch (e) {
      console.error('Failed to delete concept paper from storage', e);
    }

    // Delete associated event request and unpublish event
    await this.prisma.eventRequest.deleteMany({
      where: { eventId: id },
    });

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        conceptPaperUrl: null,
        conceptPaperPath: null,
        isPublished: false,
      },
      include: { org: true },
    });

    return {
      message: 'Concept paper deleted successfully',
      data: updatedEvent,
    };
  }

  async getEventStats(eventId: string) {
    const [registrationsCount, ticketsCount, announcementsCount] =
      await Promise.all([
        this.prisma.registration.count({
          where: {
            ticketCategory: {
              eventId,
            },
          },
        }),
        this.prisma.ticketCategory.count({
          where: { eventId },
        }),
        this.prisma.eventAnnouncements.count({
          where: { eventId },
        }),
      ]);

    return {
      registrationsCount,
      ticketsCount,
      announcementsCount,
    };
  }
}
