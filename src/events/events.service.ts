import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const updatedEvent = await this.prisma.event.update({
      where: {
        id,
      },
      data: updateEventDto,
    });

    if (updatedEvent instanceof Error) {
      throw new HttpException(
        'Event could not be updated',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Event updated successfully',
      data: updatedEvent,
    };
  }

  async publishEvent(id: string) {
    const event = await this.findOne(id);

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    const publishedEvent = await this.prisma.event.update({
      where: {
        id,
      },
      data: {
        isPublished: true,
      },
    });

    if (publishedEvent instanceof Error) {
      throw new HttpException(
        'Event could not be published',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Event published successfully',
      data: publishedEvent,
    };
  }

  async softDelete(id: string) {
    const deletedEvent = await this.prisma.event.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (deletedEvent instanceof Error) {
      throw new HttpException(
        'Event could not be deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: 'Event deleted successfully',
      data: deletedEvent,
    };
  }
}
