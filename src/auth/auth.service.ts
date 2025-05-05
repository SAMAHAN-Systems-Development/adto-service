import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserLoginDto } from './dto/user-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginUser(userLoginDto: UserLoginDto) {
    const { password, email } = userLoginDto;
    let user;

    try {
      user = await this.prismaService.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const payload = {
        email,
        sub: user.id,
        role: user.userType,
        orgId: user.organizationId,
      };
      const token = this.jwtService.sign(payload);

      return {
        access_token: token,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Unexpected Error during login:', error);
      throw new HttpException(
        'Internal server error during login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
