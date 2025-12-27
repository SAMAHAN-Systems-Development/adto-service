import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, email } = createUserDto;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        userType: UserType.USER,
        isActive: true,
      },
    });

    return newUser;
  }

  async getCurrentBooker(id: string) {
    // DO not include password in the response
    try {
      const currentBooker = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });

      return currentBooker;
    } catch (error) {
      console.error('Error fetching current booker:', error);
    }
  }

  async findAll() {
    const users = await this.prismaService.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        organization: true,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });
    if (!user) {
      throw new HttpException('Email does not exist', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });

    return updatedUser;
  }

  async deactivate(id: string) {
    const deactivatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return deactivatedUser;
  }
}
