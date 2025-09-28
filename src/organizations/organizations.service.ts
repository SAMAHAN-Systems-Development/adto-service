import {
  HttpException,
  HttpStatus,
  UseGuards,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UsersService } from 'src/users/users.service';
import { Prisma, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  private readonly ARCHIVE_ACTIONS = {
    ARCHIVE: 'archive',
    UNARCHIVE: 'unarchive',
    ARCHIVED: 'archived',
    UNARCHIVED: 'unarchived',
  } as const;

  async create(createOrganizationDto: CreateOrganizationDto) {
  const { email, password, ...organizationData } = createOrganizationDto;

  if (!organizationData.name || !email) {
      throw new HttpException(
        'Name and email are required fields',
        HttpStatus.BAD_REQUEST,
      );
  }
  try {
    
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new HttpException(
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      let userId = null;
      if (email && password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            userType: UserType.ORGANIZATION,
            isActive: true,
          },
        });
        userId = user.id;
      }

      const createdOrganization = await prisma.organizationChild.create({
        data: {
          ...organizationData,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userType: true,
              isActive: true,
            },
          },
          organizationParents: {
            include: {
              organizationParent: true,
            },
          },
        },
      });

      return {
        message: 'Organization created successfully',
        data: createdOrganization,
        statusCode: HttpStatus.CREATED,
      };
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

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

    const where = {...this.buildOrganizationSearchFilter(searchFilter),
      isArchived: false
    };

    try {
      const organizations = await this.prisma.organizationChild.findMany({
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

      return {
        message: 'Organizations fetched successfully',
        data: organizations,
        page,
        limit,
      };
    } catch (error) {
      
      throw new HttpException(
        'Error fetching organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllOrganizationsWithoutFilters() {
    try {
      const organizations = await this.prisma.organizationChild.findMany({
        where: {
          isArchived: false,
        },
      });

      if (!organizations) {
        throw new HttpException(
          'Organizations not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Organizations fetched successfully',
        data: organizations,
      };
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
      const organizations = await this.prisma.organizationGroup.findMany({
        where: {
          organizationParentId,
          organizationChild: {
            isArchived: false,
          },
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
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error fetching organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOneById(id: string) {
    const organization = await this.prisma.organizationChild.findUnique({
      where: {
        id,
      },
      include: {
        organizationParents: true,
        events: {
          include: {
            registrations: true,
            ticketCategories: true,
          },
        },
      },
    });

    if(!organization){
      throw new HttpException(
        'Organization not found',
        HttpStatus.NOT_FOUND
      );
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOneById(id);

    try {
      const updatedOrganization = await this.prisma.organizationChild.update({
        where: {
          id,
        },
        data: updateOrganizationDto,
      });

      return {
        message: 'Organization updated successfully',
        data: updatedOrganization,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {

      if (error instanceof HttpException) {
        throw error;
      }
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

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Failed to update Organization icon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async archiveOrganizationChild(id: string) {
    return this.updateArchiveStatus(id, true);
  }


  async findArchivedOrganizations(query: {
    page?: number;
    limit?: number;
    searchFilter?: string;
    orderBy?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, searchFilter, orderBy = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...this.buildOrganizationSearchFilter(searchFilter),
      isArchived: true, 
    };

    try {
      const organizations = await this.prisma.organizationChild.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: orderBy,
        },
        include: this.getOrganizationIncludes(),
      });

      return {
        message: 'Archived organizations fetched successfully',
        data: organizations,
        page,
        limit,
      };
    } catch (error) {
      throw new HttpException(
        'Error fetching archived organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async unarchiveOrganizationChild(id: string) {
    return this.updateArchiveStatus(id, false);
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
        },
      },
    };
  }

  private async updateArchiveStatus(id: string, isArchived: boolean) {
    await this.findOneById(id);

  try {
    const updatedOrganization = await this.prisma.organizationChild.update({
      where: { id },
      data: { isArchived },
    });

    const action = isArchived ? this.ARCHIVE_ACTIONS.ARCHIVED : this.ARCHIVE_ACTIONS.UNARCHIVED;

    return {
      message: `Organization ${action} successfully`,
      data: updatedOrganization,
      statusCode: HttpStatus.OK,
    };
  } catch (error) {

    const action = isArchived ? this.ARCHIVE_ACTIONS.ARCHIVE : this.ARCHIVE_ACTIONS.UNARCHIVE;
    throw new HttpException(
      `Failed to ${action} organization`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
}


