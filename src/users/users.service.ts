import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { courseId, password, ...rest } = createUserDto;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = this.prismaService.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });

    return newUser;
  }

  async findAll() {
    const users = this.prismaService.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        registrations: true,
      },
    });

    return users;
  }

  async findOne(id: string) {
    const user = this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        registrations: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });

    return updatedUser;
  }

  async deactivate(id: string) {
    const deactivatedUser = this.prismaService.user.update({
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
