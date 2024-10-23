import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from './dto/user-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(adminLoginDto: AdminLoginDto) {
    const { password, email } = adminLoginDto;
    let admin;

    try {
      admin = await this.prismaService.organizationChild.findUnique({
        where: {
          email,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const isPasswordValid = await bcrypt.compare(admin.password, password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload = { email: admin.email, sub: admin.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }

  async loginuser(userLoginDto: UserLoginDto) {
    const { password, email } = userLoginDto;
    let admin;

    try {
      admin = await this.prismaService.user.findUnique({
        where: {
          email,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const isPasswordValid = await bcrypt.compare(admin.password, password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload = { email: admin.email, sub: admin.id };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }
}
