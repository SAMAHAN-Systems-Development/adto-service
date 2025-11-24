import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  @Matches(/@addu\.edu\.ph$/, {
    message: 'Email must be an @addu.edu.ph address',
  })
  schoolEmail: string;

  @IsNotEmpty()
  @IsString()
  clusterId: string;

  @IsNotEmpty()
  @IsString()
  yearLevel: string;

  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  ticketCategoryId: string;
}
