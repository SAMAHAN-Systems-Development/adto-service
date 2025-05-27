import { IsEmail, Matches, MinLength } from 'class-validator';

export class UserSignupDto {
  @IsEmail()
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[\W_])/, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}
