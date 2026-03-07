import { IsString, IsNotEmpty } from 'class-validator';

export class DeclineTicketRequestDto {
  @IsString()
  @IsNotEmpty()
  declineReason: string;
}
