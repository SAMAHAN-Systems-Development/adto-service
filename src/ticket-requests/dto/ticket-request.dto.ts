import { IsString } from 'class-validator';

export class CreateTicketRequestDto {
  @IsString()
  ticketId: string;
}
