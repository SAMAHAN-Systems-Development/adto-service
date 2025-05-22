import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';
import { Prisma } from '@prisma/client';
import { EventsService } from 'src/events/events.service';


@Injectable()
export class OrganizationParentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createOrganizationParentDto: CreateOrganizationParentDto) {
    return 'This action adds a new organizationParent';
  }

async findAll(query: {
    page?: number;
    limit?: number;
    searchFilter?: string;
    orderBy?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 10,
      searchFilter,
      orderBy = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationParentWhereInput = {
          name: { contains: searchFilter, mode: 'insensitive' }
    };
  
    try {

    const organizationParents = await this.prisma.organizationParent.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: orderBy,
      },
      include: {
        organizationChildren: {
          include: {
            organizationChild: {
              include: {
                events: true,
              },
            },
          },
        },
      },  
    });

    const data = organizationParents.map((orgParent) => ({
      id: orgParent.id,
      name: orgParent.name,
      description: orgParent.description,
      organizationChildren: orgParent.organizationChildren.map((child) => ({
        id: child.organizationChild.id,
        name: child.organizationChild.name,
        acronym: child.organizationChild.acronym,
        icon: child.organizationChild.icon,
        description: child.organizationChild.description,
        facebook: child.organizationChild.facebook,
        instagram: child.organizationChild.instagram,
        twitter: child.organizationChild.twitter,
        linkedin: child.organizationChild.linkedin,
        isAdmin: child.organizationChild.isAdmin,
        numberofEvents: child.organizationChild.events.length,
      })),
    }));

    const totalCount = await this.prisma.organizationParent.count({ where });

    return {
      data,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
      console.error('Error fetching organization parents:', error);

      throw new InternalServerErrorException('Failed to fetch organization parents.'

      );
  }
}


  findOne(id: number) {
    return `This action returns a #${id} organizationParent`;
  }

  update(id: number, updateOrganizationParentDto: UpdateOrganizationParentDto) {
    return `This action updates a #${id} organizationParent`;
  }

  remove(id: number) {
    return `This action removes a #${id} organizationParent`;
  }
}
