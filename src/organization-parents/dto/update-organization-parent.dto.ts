import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationParentDto } from './create-organization-parent.dto';

export class UpdateOrganizationParentDto extends PartialType(CreateOrganizationParentDto) {}
