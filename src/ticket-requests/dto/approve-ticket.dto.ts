import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveTicketRequestDto {
  @IsString()
  @IsNotEmpty()
  ticketLink: string;
}
