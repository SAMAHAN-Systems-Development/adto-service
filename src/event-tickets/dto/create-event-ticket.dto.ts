import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    const parsed = new Date(value);
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) && parsed > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a future date`;
  }
}

export class CreateEventTicketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber({allowNaN: false, maxDecimalPlaces: 2})
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity: number;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  @Validate(IsFutureDateConstraint)
  registrationDeadline: string;
}
