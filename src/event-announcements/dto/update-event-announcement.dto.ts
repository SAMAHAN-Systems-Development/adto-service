import { PartialType } from '@nestjs/mapped-types';
import { CreateEventAnnouncementDto } from './create-event-announcement.dto';

export class UpdateEventAnnouncementDto extends PartialType(CreateEventAnnouncementDto) {}
