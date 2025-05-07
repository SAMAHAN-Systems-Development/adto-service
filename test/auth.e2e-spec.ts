import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserType } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'password123';
  let testUserId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authToken: string;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserPassword, salt);
    const user = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: { password: hashedPassword, isActive: true },
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
    const userExists = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    if (userExists) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.user.deleteMany({ where: { email: 'inactive@example.com' } });
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return an access token and set cookie for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('auth_token');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(Array.isArray(response.headers['set-cookie'])).toBe(true);
      expect(response.headers['set-cookie'].length).toBeGreaterThan(0);

      authToken = response.body.auth_token;
      authCookie = response.headers['set-cookie'][0];
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
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return Unauthorized for inactive user', async () => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          password: hashedPassword,
          userType: UserType.USER,
          isActive: false, // Mark as inactive
        },
      });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'inactive@example.com', password: 'password123' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Tests for Logout ---
  describe('/auth/logout (POST)', () => {
    it('should clear the auth cookie', () => {
      if (!authCookie) {
        throw new Error('Login test must run first to get auth cookie');
      }
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', authCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const setCookieHeader = res.headers['set-cookie'];
          expect(setCookieHeader).toBeDefined();
          expect(setCookieHeader[0]).toMatch(/token=;/);
          expect(setCookieHeader[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
        });
    });

    it('should allow logout even if not logged in (idempotent)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(HttpStatus.OK);
    });
  });
});
