import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  contactNumber: string;

  @IsString()
  courseId: string;

  @IsBoolean()
  isAlumni: boolean;

  @IsOptional()
  @IsInt()
  batch?: number;
}
