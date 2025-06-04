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
import { UserSignupDto } from './dto/user-signup.dto';

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
  async registerUser(signupDto: UserSignupDto) {
    const { email, password } = signupDto;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        isActive: true,
        userType: 'USER',
      },
    });

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.userType,
      orgId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}
