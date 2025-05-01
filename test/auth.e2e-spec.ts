import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';
import { ValidationPipe } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'password123';
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Ensure the test user exists
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserPassword, salt);
    const user = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: { password: hashedPassword },
      create: {
        email: testUserEmail,
        password: hashedPassword,
        userType: UserType.USER,
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up the test user
    await prisma.user.delete({ where: { id: testUserId } });
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return an access token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('auth_token');
          expect(res.headers['set-cookie']).toBeDefined(); // Check if cookie is set
        });
    });

    it('should return Unauthorized for invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUserEmail, password: 'wrongpassword' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return Not Found for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'password123' })
        .expect(HttpStatus.NOT_FOUND); // Based on AuthService logic throwing NotFoundException first
    });
  });
});
