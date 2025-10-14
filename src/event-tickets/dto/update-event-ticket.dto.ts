import { PartialType } from '@nestjs/mapped-types';
import { CreateEventTicketDto } from './create-event-ticket.dto';

export class UpdateEventTicketDto extends PartialType(CreateEventTicketDto) {}
