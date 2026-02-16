import { IsOptional, IsString } from 'class-validator';

export class ApproveTicketRequestDto {
  @IsString()
  @IsOptional()
  ticketLink?: string;
}
