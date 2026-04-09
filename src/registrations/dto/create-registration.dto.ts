import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  yearLevel: string;

  @IsString()
  @IsNotEmpty()
  course: string;

  @IsString()
  @IsNotEmpty()
  cluster: string;

  @IsString()
  @IsNotEmpty()
  ticketCategoryId: string;

  @IsOptional()
  @IsBoolean()
  hasRsvpd?: boolean;

  @ValidateIf((object: CreateRegistrationDto) =>
    Boolean(object.organizationChildId),
  )
  @IsString()
  @IsNotEmpty({
    message:
      'organizationParentId is required when organizationChildId is provided',
  })
  organizationParentId?: string;

  @ValidateIf((object: CreateRegistrationDto) =>
    Boolean(object.organizationParentId),
  )
  @IsString()
  @IsNotEmpty({
    message:
      'organizationChildId is required when organizationParentId is provided',
  })
  organizationChildId?: string;
}
