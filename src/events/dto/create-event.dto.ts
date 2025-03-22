import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsBoolean,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsISO8601()
  @IsNotEmpty()
  dateStart: string;

  @IsISO8601()
  @IsNotEmpty()
  dateEnd: string;

  @IsBoolean()
  @IsOptional()
  isRegistrationOpen?: boolean;

  @IsBoolean()
  @IsOptional()
  isRegistrationRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isOpenToOutsiders?: boolean;

  @IsString()
  @IsNotEmpty()
  orgId: string;
}
