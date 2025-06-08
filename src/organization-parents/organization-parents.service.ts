import { Injectable } from '@nestjs/common';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationParentsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createOrganizationParentDto: CreateOrganizationParentDto) {
    return 'This action adds a new organizationParent';
  }

  async findAll() {
    const organizationParents = await this.prisma.organizationParent.findMany();

    if (!organizationParents) {
      return {
        message: 'No organization parents found',
      };
    }

    return organizationParents;
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
