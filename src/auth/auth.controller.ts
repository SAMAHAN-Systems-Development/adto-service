import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login/admin')
  async loginAdmin(@Body() createAuthDto: AdminLoginDto) {
    return this.authService.loginAdmin(createAuthDto);
  }

  @Public()
  @Post('/login/user')
  async loginuser(@Body() createAuthDto: AdminLoginDto) {
    return this.authService.loginuser(createAuthDto);
  }
}
