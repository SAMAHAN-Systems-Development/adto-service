import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveTicketRequestDto {
  @IsString()
  @IsNotEmpty()
  ticketLink: string;

  @IsOptional()
  @IsString()
  messengerLink?: string;
}
