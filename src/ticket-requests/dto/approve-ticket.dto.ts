import { IsString, IsNotEmpty } from 'class-validator';

export class ApproveTicketRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  ticketLink: string;
}
