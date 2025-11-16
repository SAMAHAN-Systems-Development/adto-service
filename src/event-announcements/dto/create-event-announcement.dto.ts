import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AnnouncementType } from '@prisma/client';

export class CreateEventAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsEnum(AnnouncementType)
  announcementType: AnnouncementType;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}
