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
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
