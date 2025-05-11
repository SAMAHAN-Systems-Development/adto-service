import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createEventDto: CreateEventDto) {
    const { orgId, ...eventDetails } = createEventDto;
    const createdEvent = await this.prisma.event.create({
      data: {
        ...eventDetails,
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

  async findAll(query: {
    page?: number;
    limit?: number;
    isRegistrationOpen?: boolean;
    isRegistrationRequired?: boolean;
    isOpenToOutsiders?: boolean;
    searchFilter?: string;
    orderBy?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      isRegistrationOpen,
      isRegistrationRequired,
      isOpenToOutsiders,
      searchFilter,
      orderBy = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      ...(isRegistrationOpen && { isRegistrationOpen }),
      ...(isRegistrationRequired && { isRegistrationRequired }),
      ...(isOpenToOutsiders && { isOpenToOutsiders }),
      ...(searchFilter && {
        OR: [
          { name: { contains: searchFilter, mode: 'insensitive' } },
          { description: { contains: searchFilter, mode: 'insensitive' } },
          { org: { name: { contains: searchFilter, mode: 'insensitive' } } },
          { org: { acronym: { contains: searchFilter, mode: 'insensitive' } } },
        ],
      }),
      isPublished: true,
      deletedAt: null,
    };

    const events = await this.prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        dateStart: orderBy,
      },
      include: {
        org: true,
      },
    });

    const totalCount = await this.prisma.event.count({ where });

    return {
      data: events,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findAllByOrganizationChild(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      isRegistrationOpen?: boolean;
      isRegistrationRequired?: boolean;
      isOpenToOutsiders?: boolean;
      searchFilter?: string;
      orderBy?: 'asc' | 'desc';
    },
  ) {
    const {
      page = 1,
      limit = 10,
      isRegistrationOpen,
      isRegistrationRequired,
      isOpenToOutsiders,
      searchFilter,
      orderBy = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      ...(isRegistrationOpen && { isRegistrationOpen }),
      ...(isRegistrationRequired && { isRegistrationRequired }),
      ...(isOpenToOutsiders && { isOpenToOutsiders }),
      ...(searchFilter && {
        OR: [
          { name: { contains: searchFilter, mode: 'insensitive' } },
          { description: { contains: searchFilter, mode: 'insensitive' } },
          { org: { name: { contains: searchFilter, mode: 'insensitive' } } },
          { org: { acronym: { contains: searchFilter, mode: 'insensitive' } } },
        ],
      }),
      deletedAt: null,
      orgId,
    };

    const events = await this.prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        dateStart: orderBy,
      },
      include: {
        org: true,
      },
    });

    const totalCount = await this.prisma.event.count({ where });

    return {
      data: events,
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
          registrations: true,
          ticketCategories: true,
          formQuestions: true,
        },
      });

      return event;
    } catch (error) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    user: { role: string; orgId: string },
  ) {
    const { role, orgId } = user;

    const currentEvent = await this.findOne(id);

    if (!currentEvent || currentEvent.deletedAt !== null) {
      throw new HttpException(
        'Event not found or has been deleted',
        HttpStatus.NOT_FOUND,
      );
    }

    const hasPermission = role === 'ADMIN' || currentEvent.orgId === orgId;

    if (!hasPermission) {
      throw new HttpException(
        'You are not authorized to update this event',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const updatedEvent = await this.prisma.event.update({
        where: {
          id,
        },
        data: { ...updateEventDto, updatedAt: new Date(Date.now()) },
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
}
