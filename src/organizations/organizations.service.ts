import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    try {
      const createdOrganization = this.prisma.organizationChild.create({
        data: {
          ...createOrganizationDto,
        },
      });
      return createdOrganization;
    } catch (error) {
      throw new HttpException(
        'Failed to create organization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    searchFilter?: string;
    orderBy?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, searchFilter, orderBy = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where = this.buildOrganizationSearchFilter(searchFilter);

    try {
      const organizations = this.prisma.organizationChild.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: orderBy,
        },
        include: this.getOrganizationIncludes(),
      });

      if (!organizations) {
        throw new HttpException(
          'Organizations not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return organizations;
    } catch (error) {
      throw new HttpException(
        'Error fetching organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllByOrganizationParent(
    organizationParentId: string,
    query: {
      page?: number;
      limit?: number;
    },
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    try {
      const organizations = this.prisma.organizationGroup.findMany({
        where: {
          organizationParentId,
        },
        skip,
        take: limit,
        include: {
          organizationChild: {
            include: this.getOrganizationIncludes(),
          },
        },
      });

      return organizations;
    } catch (error) {
      throw new HttpException(
        'Error fetching organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOneById(id: string) {
    const organization = this.prisma.organizationChild.findUnique({
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

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOneById(id);
    try {
      const updatedOrganization = this.prisma.organizationChild.update({
        where: {
          id,
        },
        data: updateOrganizationDto,
      });

      return updatedOrganization;
    } catch (error) {
      throw new HttpException(
        'Failed to update organization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateOrganizationIcon(id: string, icon: Express.Multer.File) {
    const organization = await this.findOneById(id);

    if (!organization) {
      throw new HttpException('Organization not found', HttpStatus.NOT_FOUND);
    }

    const organizationIconFileName = `${organization.name}-icon`;

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const uploadedIcon = await this.supabase.uploadFile(
          icon,
          organizationIconFileName,
          process.env.SUPABASE_BUCKET_NAME!,
        );

        if (!uploadedIcon) {
          throw new HttpException(
            'Failed to upload Organization icon',
            HttpStatus.BAD_REQUEST,
          );
        }

        const retrievedIconUrl = await this.supabase.getFileUrl(
          organizationIconFileName,
          process.env.SUPABASE_BUCKET_NAME!,
        );

        if (!retrievedIconUrl) {
          throw new HttpException(
            'Failed to retrieve Organization icon',
            HttpStatus.BAD_REQUEST,
          );
        }

        const updatedOrganization = await prisma.organizationChild.update({
          where: { id },
          data: { icon: retrievedIconUrl },
        });

        return updatedOrganization;
      });

      return {
        message: 'Organization icon updated successfully',
        organization: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update Organization icon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async archiveOrganizationChild(id: string) {
    if (!(await this.prisma.organizationChild.findFirst({ where: { id } }))) {
      throw new NotFoundException('Organization child does not exist');
    }

    try {
      return await this.prisma.organizationChild.update({
        where: { id },
        data: { isArchived: true },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to archive organization child',
        {
          cause: error,
          description: 'An unexpected error occurred',
        },
      );
    }
  }

  private buildOrganizationSearchFilter(
    searchFilter?: string,
  ): Prisma.OrganizationChildWhereInput {
    if (!searchFilter) return {};

    return {
      OR: [
        {
          name: {
            contains: searchFilter,
            mode: 'insensitive',
          },
        },
        {
          acronym: {
            contains: searchFilter,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  private getOrganizationIncludes(): Prisma.OrganizationChildInclude {
    return {
      organizationParents: true,
      events: {
        include: {
          registrations: true,
          ticketCategories: true,
          formQuestions: true,
        },
      },
    };
  }
}
