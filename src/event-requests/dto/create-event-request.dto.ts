import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEventRequestDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;
}
