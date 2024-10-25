import { IsEmail, IsString } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  password: string;
}
