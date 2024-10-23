import { Injectable } from '@nestjs/common';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';

@Injectable()
export class OrganizationParentsService {
  create(createOrganizationParentDto: CreateOrganizationParentDto) {
    return 'This action adds a new organizationParent';
  }

  findAll() {
    return `This action returns all organizationParents`;
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
