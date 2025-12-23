import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRegistrationDto: CreateRegistrationDto) {
    const createdRegistration = await this.prisma.registration.create({
      data: createRegistrationDto,
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
  }

  async findAll() {
    try {
      const registration = await this.prisma.registration.findMany();
      if (!registration) {
        throw new HttpException(
          `Registrations not found`,
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

  async findOne(id: string) {
    try {
      const registration = await this.prisma.registration.findUnique({
        where: { id },
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
