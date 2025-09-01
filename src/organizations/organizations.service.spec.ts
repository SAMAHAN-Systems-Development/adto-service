import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../prisma/prisma.service'; 
import { SupabaseService } from '../supabase/supabase.service'; 
import { Prisma, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaService: PrismaService;
  let supabaseService: SupabaseService;

  // Mock implementations
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organizationChild: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    organizationGroup: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockSupabaseService = {
    uploadFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validCreateDto: CreateOrganizationDto = {
      name: 'Test Organization',
      email: 'test@example.com',
      password: 'password123',
      acronym: 'TO',
      description: 'A test organization',
    };

    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      userType: UserType.ORGANIZATION,
      isActive: true,
    };

    const mockCreatedOrganization = {
      id: 'org_123',
      name: 'Test Organization',
      acronym: 'TO',
      description: 'A test organization',
      userId: 'user_123',
      user: mockUser,
      organizationParents: [],
    };

    beforeEach(() => {
      // Setup bcrypt mocks
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should create an organization successfully with email and password', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null); // Email doesn't exist
      
      // Mock the transaction function
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        // Mock prisma within transaction
        const mockPrismaTransaction = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          organizationChild: {
            create: jest.fn().mockResolvedValue(mockCreatedOrganization),
          },
        };
        
        return callback(mockPrismaTransaction);
      });

      // Act
      const result = await service.create(validCreateDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: validCreateDto.email },
      });
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(validCreateDto.password, 'salt');
      
      expect(result).toEqual({
        message: 'Organization created successfully',
        data: mockCreatedOrganization,
        statusCode: HttpStatus.CREATED,
      });
    });

    it('should create organization without password if not provided', async () => {
      // Arrange
      const createDtoWithoutPassword: CreateOrganizationDto = {
        name: 'Test Organization',
        email: 'test@example.com',
        acronym: 'TO',
      };

      const mockOrgWithoutUser = {
        ...mockCreatedOrganization,
        userId: null,
        user: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrismaTransaction = {
          user: { create: jest.fn() },
          organizationChild: {
            create: jest.fn().mockResolvedValue(mockOrgWithoutUser),
          },
        };
        return callback(mockPrismaTransaction);
      });

      // Act
      const result = await service.create(createDtoWithoutPassword);

      // Assert
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      
      expect(result.data.userId).toBeNull();
    });

    it('should throw BadRequest when name is missing', async () => {
      // Arrange
      const invalidDto = {
        email: 'test@example.com',
        password: 'password123',
        // name is missing
      } as CreateOrganizationDto;

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow(
        new HttpException(
          'Name and email are required fields',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when email is missing', async () => {
      // Arrange
      const invalidDto = {
        name: 'Test Organization',
        password: 'password123',
        // email is missing
      } as CreateOrganizationDto;

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow(
        new HttpException(
          'Name and email are required fields',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw Conflict when email already exists', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser); // Email exists

      // Act & Assert
      await expect(service.create(validCreateDto)).rejects.toThrow(
        new HttpException('Email already exists', HttpStatus.CONFLICT),
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during user creation', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      const prismaError = new Error('Database connection failed');
      mockPrismaService.$transaction.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.create(validCreateDto)).rejects.toThrow(
        new HttpException(
          'Failed to create organization',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('archiveOrganizationChild', () => {
    it('should archive organization successfully', async () => {
      // Arrange
      const orgId = 'org_123';
      const existingOrg = { id: orgId, isArchived: false };
      const archivedOrg = { ...existingOrg, isArchived: true };

      mockPrismaService.organizationChild.findFirst.mockResolvedValue(existingOrg);
      mockPrismaService.organizationChild.update.mockResolvedValue(archivedOrg);

      // Act
      const result = await service.archiveOrganizationChild(orgId);

      // Assert
      expect(mockPrismaService.organizationChild.findFirst).toHaveBeenCalledWith({
        where: { id: orgId },
      });
      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      // Arrange
      const orgId = 'nonexistent';
      mockPrismaService.organizationChild.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.archiveOrganizationChild(orgId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.organizationChild.update).not.toHaveBeenCalled();
    });
  });
});