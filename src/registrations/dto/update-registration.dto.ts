import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateRegistrationDto } from './create-registration.dto';

export class UpdateRegistrationDto extends PartialType(CreateRegistrationDto) {
  @IsOptional()
  @IsString()
  organizationParentId?: string | null;

  @IsOptional()
  @IsString()
  organizationChildId?: string | null;
}
