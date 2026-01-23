import { IsString } from 'class-validator';

export class CreateOrganizationParentDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
