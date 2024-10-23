import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createOrganizationDto: CreateOrganizationDto) {
    const { name, ...rest } = createOrganizationDto;
    const setPassword = `${name}-ateneo`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(setPassword, salt);
    const newOrganization = this.prismaService.organizationChild.create({
      data: {
        ...rest,
        password: hashedPassword,
        name,
      },
    });

    return newOrganization;
  }

  async findAll() {
    const organizations = this.prismaService.organizationChild.findMany({
      include: {
        organizationParents: true,
        events: {
          include: {
            registrations: true,
            ticketCategories: true,
            formQuestions: true,
          },
        },
      },
    });

    return organizations;
  }

  async findOneById(id: string) {
    const organization = this.prismaService.organizationChild.findUnique({
      where: {
        id,
      },
      include: {
        organizationParents: true,
        events: {
          include: {
            registrations: true,
            ticketCategories: true,
            formQuestions: true,
          },
        },
      },
    });

    return organization;
  }

  async findOneByEmail(email: string) {
    const organization = this.prismaService.organizationChild.findUnique({
      where: {
        email,
      },
      include: {
        organizationParents: true,
        events: {
          include: {
            registrations: true,
            ticketCategories: true,
            formQuestions: true,
          },
        },
      },
    });

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const updatedOrganization = this.prismaService.organizationChild.update({
      where: {
        id,
      },
      data: updateOrganizationDto,
    });

    return updatedOrganization;
  }

  async deactivate(id: string) {
    const deactivatedOrganization = this.prismaService.organizationChild.update(
      {
        where: {
          id,
        },
        data: {
          isActive: false,
        },
      },
    );

    return deactivatedOrganization;
  }
}
