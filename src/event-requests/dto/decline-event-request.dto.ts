import { IsString, IsNotEmpty } from 'class-validator';

export class DeclineEventRequestDto {
  @IsString()
  @IsNotEmpty()
  declineReason: string;
}
