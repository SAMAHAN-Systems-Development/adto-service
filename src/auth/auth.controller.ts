import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { UserLoginDto } from './dto/user-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signIn(
    @Body() loginDto: UserLoginDto,
    @Res({ passthrough: true }) res,
  ) {
    const { access_token } = await this.authService.loginUser(loginDto);

    if (!access_token) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Invalid credentials' };
    }

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    return { message: 'Login successful', auth_token: access_token };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async signOut(@Res({ passthrough: true }) res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    return { message: 'Logout successful' };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
