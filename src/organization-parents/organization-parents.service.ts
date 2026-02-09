import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrganizationParentDto: CreateOrganizationParentDto) {
    try {
      const createOrgParent = await this.prisma.organizationParent.create({
        data: {
          ...createOrganizationParentDto,
        },
      });

      return {
        message: 'Organization parent created successfully',
        data: createOrgParent,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    const organizationParents = await this.prisma.organizationParent.findMany({
      include: {
        _count: {
          select: {
            organizationChildren: true,
          },
        },
      },
    });

    if (!organizationParents || organizationParents.length === 0) {
      return {
        message: 'No organization parents found',
      };
    }

    return organizationParents.map(({ _count, ...parent }) => ({
      ...parent,
      orgCount: _count.organizationChildren,
    }));
  }

  async findOne(id: string) {
    try {
      const organizationParent =
        await this.prisma.organizationParent.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                organizationChildren: true,
              },
            },
          },
        });

      if (!organizationParent) {
        throw new NotFoundException('Organization parent not found');
      }

      const { _count, ...parent } = organizationParent;
      return {
        ...parent,
        orgCount: _count.organizationChildren,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(
    id: string,
    updateOrganizationParentDto: UpdateOrganizationParentDto,
  ) {
    try {
      // First check if the organization parent exists
      const existingOrgParent = await this.prisma.organizationParent.findUnique(
        {
          where: { id },
        },
      );

      if (!existingOrgParent) {
        throw new NotFoundException('Organization parent not found');
      }

      const updatedOrgParent = await this.prisma.organizationParent.update({
        where: { id },
        data: {
          ...updateOrganizationParentDto,
        },
      });

      return {
        message: 'Organization parent updated successfully',
        data: updatedOrgParent,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string) {
    try {
      const orgParent = await this.prisma.organizationParent.findUnique({
        where: { id },
        include: { organizationChildren: true },
      });

      if (!orgParent) {
        throw new NotFoundException('Organization parent not found');
      }

      if (
        orgParent.organizationChildren &&
        orgParent.organizationChildren.length > 0
      ) {
        throw new ConflictException(
          'Cannot delete organization parent with existing organization children',
        );
      }

      await this.prisma.organizationParent.delete({ where: { id } });
      return { message: 'Organization parent deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}
