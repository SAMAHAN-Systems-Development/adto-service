// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSignupDto } from './dto/user-signup.dto';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: UserLoginDto, @Res() res: Response) {
    const { access_token } = await this.authService.loginUser(loginDto);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return res.send({ message: 'Login successful', auth_token: access_token });
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signup(@Body() signupDto: UserSignupDto, @Res() res: Response) {
    const { access_token } = await this.authService.registerUser(signupDto);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return res.send({ message: 'Signup successful', auth_token: access_token });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    return res.send({ message: 'Logout successful' });
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req['user'];
  }
}
