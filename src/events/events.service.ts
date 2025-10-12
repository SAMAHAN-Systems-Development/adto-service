import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  

  async create(createEventDto: CreateEventDto, orgId: string) {
    const createdEvent = await this.prisma.event.create({
      data: {
        ...createEventDto,
        dateStart: new Date(createEventDto.dateStart),
        dateEnd: new Date(createEventDto.dateEnd),
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
    organizationId?: string;
    organizationParentId?: string;
    orderBy?: 'asc' | 'desc';
  }) {
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
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      ...(isRegistrationOpen && { isRegistrationOpen }),
      ...(isRegistrationRequired && { isRegistrationRequired }),
      ...(isOpenToOutsiders && { isOpenToOutsiders }),
      ...(organizationId && { orgId: organizationId }),
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
          registrations: {
            include: {
              payment: true,
            },
          },
          ticketCategories: true,
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
      const updatedEvent = await this.prisma.event.update({
        where: {
          id,
        },
        data: {
          ...updateEventDto,
          // Convert date strings to Date objects if they exist
          ...(updateEventDto.dateStart && { dateStart: new Date(updateEventDto.dateStart) }),
          ...(updateEventDto.dateEnd && { dateEnd: new Date(updateEventDto.dateEnd) }),
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
      // Handle specific Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Event not found', {
            cause: error,
            description: 'The event with the provided ID does not exist',
          });
        }
        if (error.code === 'P2002') {
          throw new HttpException(
            'Event update failed due to constraint violation',
            HttpStatus.CONFLICT,
          );
        }
      }

      // Handle validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException(
          'Invalid data provided for event update',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Re-throw HTTP exceptions from findOne
      if (error instanceof HttpException) {
        throw error;
      }

      // Generic error for unexpected cases
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating the event',
        {
          cause: error,
          description: 'Please try again or contact support if the issue persists',
        },
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Event not found', {
            cause: error,
            description: 'The event with the provided ID does not exist',
          });
        }
        if (error.code === 'P2002') {
          throw new HttpException(
            'Event publish failed due to constraint violation',
            HttpStatus.CONFLICT,
          );
        }
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException(
          'Invalid data provided for event publish',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Event could not be published',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Event not found', {
            cause: error,
            description: 'The event with the provided ID does not exist',
          });
        }
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException(
          'Invalid data provided for event deletion',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Event could not be deleted',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  
  async archive(id: string) {
    await this.findOne(id);
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
}
