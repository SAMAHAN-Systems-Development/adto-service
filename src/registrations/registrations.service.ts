import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRegistrationDto: CreateRegistrationDto) {
    try {
      const { ticketCategoryId, email, ...registrationData } =
        createRegistrationDto;
      // Verify ticket category exists and has capacity
      const ticketCategory = await this.prisma.ticketCategory.findUnique({
        where: { id: ticketCategoryId },
        include: {
          event: true,
          _count: { select: { registrations: true } },
        },
      });

      if (!ticketCategory) {
        throw new HttpException(
          'Ticket category not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check for duplicate registration - same email for same event
      const existingRegistration = await this.prisma.registration.findFirst({
        where: {
          email: email,
          ticketCategory: {
            eventId: ticketCategory.eventId,
          },
        },
      });

      if (existingRegistration) {
        throw new HttpException(
          'You have already registered for this event',
          HttpStatus.CONFLICT,
        );
      }

      // Check if registration deadline has passed
      if (new Date() > ticketCategory.registrationDeadline) {
        throw new HttpException(
          'Registration deadline has passed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check capacity
      if (ticketCategory._count.registrations >= ticketCategory.capacity) {
        throw new HttpException(
          'Ticket category is full',
          HttpStatus.BAD_REQUEST,
        );
      }

      const createdRegistration = await this.prisma.registration.create({
        data: { ticketCategoryId, email, ...registrationData },
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
      });

      return {
        message: 'Registration created successfully',
        data: createdRegistration,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Registration creation error:', error);
      throw new HttpException(
        'Failed to create registration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllByEvent(
    eventId: string,
    query: {
      page?: number;
      limit?: number;
      searchFilter?: string;
      orderBy?: 'asc' | 'desc';
    },
  ) {
    const { page = 1, limit = 10, searchFilter, orderBy = 'desc' } = query;
    const skip = (page - 1) * limit;

    try {
      const where = {
        ticketCategory: {
          eventId: eventId, // Filter by event ID instead of org ID
        },
        ...(searchFilter && {
          OR: [
            {
              fullName: {
                contains: searchFilter,
                mode: 'insensitive' as const,
              },
            },
            { email: { contains: searchFilter, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [registrations, totalCount] = await Promise.all([
        this.prisma.registration.findMany({
          where,
          skip,
          take: limit,
          include: {
            ticketCategory: {
              include: {
                event: {
                  include: {
                    org: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: orderBy },
        }),
        this.prisma.registration.count({ where }),
      ]);

      return {
        message: 'Registrations fetched successfully',
        data: registrations,
        meta: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch registrations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const registration = await this.prisma.registration.findUnique({
        where: { id },
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
      });

      if (!registration) {
        throw new HttpException(
          `Registration with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Registration fetched successfully',
        data: registration,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to fetch registration`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateRegistrationDto: UpdateRegistrationDto) {
    try {
      await this.findOne(id);
      const updatedRegistration = await this.prisma.registration.update({
        where: { id },
        data: updateRegistrationDto,
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
      });

      return {
        message: 'Registration updated successfully',
        data: updatedRegistration,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update registration`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
