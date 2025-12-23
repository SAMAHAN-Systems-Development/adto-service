import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  eventId: string;
}
