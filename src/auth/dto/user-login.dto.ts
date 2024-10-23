import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UserLoginDto {
  @IsEmail()
  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  password: string;
}
