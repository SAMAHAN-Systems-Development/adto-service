import { IsString } from 'class-validator';

export class CreateTicketRequestDto {
  @IsString()
  ticketLink?: string;
}
