import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRegistrationDto: CreateRegistrationDto) {
    try {
      // Verify ticket category exists and has capacity
      const ticketCategory = await this.prisma.ticketCategory.findUnique({
        where: { id: createRegistrationDto.ticketCategoryId },
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
        data: createRegistrationDto,
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
      });

      if (createdRegistration instanceof Error) {
        throw new HttpException(
          'Registration could not be created',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        message: 'Registration created successfully',
        data: createdRegistration,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create registration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const registrations = await this.prisma.registration.findMany({
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        message: 'Registrations fetched successfully',
        data: registrations,
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
        `Failed to fetch registration`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
