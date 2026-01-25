import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { S3Service } from '../s3/s3.service';
import { Prisma, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaService: PrismaService;
  let s3Service: S3Service;
  let usersService: UsersService;

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

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    deactivate: jest.fn(),
    getCurrentBooker: jest.fn(),
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
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
    usersService = module.get<UsersService>(UsersService);

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
      mockUsersService.findByEmail.mockResolvedValue(null); // Email doesn't exist

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
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        validCreateDto.email,
      );

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

      mockUsersService.findByEmail.mockResolvedValue(null);

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

      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
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

      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw Conflict when email already exists', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser); // Email exists

      // Act & Assert
      await expect(service.create(validCreateDto)).rejects.toThrow(
        new HttpException(
          'A user with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during user creation', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null);

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

  // ...existing code...

  describe('archiveOrganizationChild', () => {
    it('should archive organization successfully', async () => {
      // Arrange
      const orgId = 'org_123';
      const existingOrg = {
        id: orgId,
        name: 'Test Org',
        isArchived: false,
      };
      const archivedOrg = { ...existingOrg, isArchived: true };

      // Mock findOneById (not findFirst)
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrg,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue(archivedOrg);

      // Act
      const result = await service.archiveOrganizationChild(orgId);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: orgId },
        include: {
          organizationParents: true,
          events: {
            include: {
              registrations: true,
              ticketCategories: true,
            },
          },
        },
      });

      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { isArchived: true },
      });

      // Check the structured response
      expect(result).toEqual({
        message: 'Organization archived successfully',
        data: archivedOrg,
        statusCode: HttpStatus.OK,
      });
    });

    it('should throw HttpException when organization does not exist for archive', async () => {
      // Arrange
      const orgId = 'nonexistent';
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.archiveOrganizationChild(orgId)).rejects.toThrow(
        new HttpException('Organization not found', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.organizationChild.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during archive', async () => {
      // Arrange
      const orgId = 'org_123';
      const existingOrg = { id: orgId, isArchived: false };

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrg,
      );
      mockPrismaService.organizationChild.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.archiveOrganizationChild(orgId)).rejects.toThrow(
        new HttpException(
          'Failed to archive organization',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('unarchiveOrganizationChild', () => {
    it('should unarchive organization successfully', async () => {
      // Arrange
      const orgId = 'org_123';
      const existingOrg = {
        id: orgId,
        name: 'Test Org',
        isArchived: true,
      };
      const unarchivedOrg = { ...existingOrg, isArchived: false };

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrg,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue(
        unarchivedOrg,
      );

      // Act
      const result = await service.unarchiveOrganizationChild(orgId);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: orgId },
        include: {
          organizationParents: true,
          events: {
            include: {
              registrations: true,
              ticketCategories: true,
            },
          },
        },
      });

      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { isArchived: false },
      });

      expect(result).toEqual({
        message: 'Organization unarchived successfully',
        data: unarchivedOrg,
        statusCode: HttpStatus.OK,
      });
    });

    it('should throw HttpException when organization does not exist for unarchive', async () => {
      // Arrange
      const orgId = 'nonexistent';
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.unarchiveOrganizationChild(orgId)).rejects.toThrow(
        new HttpException('Organization not found', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.organizationChild.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during unarchive', async () => {
      // Arrange
      const orgId = 'org_123';
      const existingOrg = { id: orgId, isArchived: true };

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrg,
      );
      mockPrismaService.organizationChild.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.unarchiveOrganizationChild(orgId)).rejects.toThrow(
        new HttpException(
          'Failed to unarchive organization',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('updateArchiveStatus (private method via public methods)', () => {
    it('should toggle archive status correctly', async () => {
      // Test through both public methods to verify the private method works
      const orgId = 'org_123';
      const existingOrg = { id: orgId, isArchived: false };

      // Test archiving
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrg,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue({
        ...existingOrg,
        isArchived: true,
      });

      const archiveResult = await service.archiveOrganizationChild(orgId);
      expect(archiveResult.message).toBe('Organization archived successfully');

      // Reset mocks for unarchive test
      jest.clearAllMocks();

      // Test unarchiving
      mockPrismaService.organizationChild.findUnique.mockResolvedValue({
        ...existingOrg,
        isArchived: true,
      });
      mockPrismaService.organizationChild.update.mockResolvedValue({
        ...existingOrg,
        isArchived: false,
      });

      const unarchiveResult = await service.unarchiveOrganizationChild(orgId);
      expect(unarchiveResult.message).toBe(
        'Organization unarchived successfully',
      );
    });
  });

  describe('update', () => {
    const orgId = 'org_123';
    const updateDto: UpdateOrganizationDto = {
      name: 'Updated Organization Name',
      acronym: 'UON',
      description: 'Updated description',
      facebook: 'https://facebook.com/updated',
    };

    const existingOrganization = {
      id: orgId,
      name: 'Original Organization',
      acronym: 'OO',
      description: 'Original description',
      isArchived: false,
      userId: 'user_123',
      user: {
        id: 'user_123',
        email: 'org@example.com',
        userType: UserType.ORGANIZATION,
        isActive: true,
      },
      organizationParents: [],
      events: [],
    };

    const updatedOrganization = {
      ...existingOrganization,
      ...updateDto,
    };

    it('should update organization successfully', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue(
        updatedOrganization,
      );

      // Act
      const result = await service.update(orgId, updateDto);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: orgId },
        include: {
          organizationParents: true,
          events: {
            include: {
              registrations: true,
              ticketCategories: true,
            },
          },
        },
      });

      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: updateDto,
      });

      expect(result).toEqual({
        message: 'Organization updated successfully',
        data: updatedOrganization,
        statusCode: HttpStatus.OK,
      });
    });

    it('should throw HttpException when organization does not exist', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        new HttpException('Organization not found', HttpStatus.NOT_FOUND),
      );

      expect(mockPrismaService.organizationChild.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );
      mockPrismaService.organizationChild.update.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        new HttpException(
          'Failed to update organization',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle Prisma known request errors during update', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );

      const prismaError = new Error('Prisma known error');
      prismaError.name = 'PrismaClientKnownRequestError';
      prismaError['code'] = 'P2025'; // Record not found

      mockPrismaService.organizationChild.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        new HttpException(
          'Failed to update organization',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should update organization with partial data', async () => {
      // Arrange
      const partialUpdateDto: UpdateOrganizationDto = {
        name: 'Partially Updated Name',
      };

      const partiallyUpdatedOrganization = {
        ...existingOrganization,
        name: 'Partially Updated Name',
      };

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue(
        partiallyUpdatedOrganization,
      );

      // Act
      const result = await service.update(orgId, partialUpdateDto);

      // Assert
      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: partialUpdateDto,
      });

      expect(result.data.name).toBe('Partially Updated Name');
      expect(result.message).toBe('Organization updated successfully');
    });

    it('should update organization with empty update data', async () => {
      // Arrange
      const emptyUpdateDto: UpdateOrganizationDto = {};

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );
      mockPrismaService.organizationChild.update.mockResolvedValue(
        existingOrganization,
      );

      // Act
      const result = await service.update(orgId, emptyUpdateDto);

      // Assert
      expect(mockPrismaService.organizationChild.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: {},
      });

      expect(result.data).toEqual(existingOrganization);
      expect(result.message).toBe('Organization updated successfully');
    });

    it('should re-throw HttpException errors without wrapping', async () => {
      // Arrange
      const customHttpException = new HttpException(
        'Custom error',
        HttpStatus.BAD_REQUEST,
      );

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        existingOrganization,
      );
      mockPrismaService.organizationChild.update.mockRejectedValue(
        customHttpException,
      );

      // Act & Assert
      await expect(service.update(orgId, updateDto)).rejects.toThrow(
        customHttpException,
      );
    });
  });

  describe('updateOrganizationIcon', () => {
    const orgId = 'org_123';
    const mockFile: Express.Multer.File = {
      fieldname: 'icon',
      originalname: 'organization-logo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 50000,
      buffer: Buffer.from('fake-image-data'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const mockOrganization = {
      id: orgId,
      name: 'Test Organization',
      acronym: 'TO',
      userId: 'user_123',
      icon: null,
      organizationParents: [],
      events: [],
    };

    const mockUploadResult = {
      key: 'organization-icons/1234567890-organization-logo.png',
      url: 'https://s3.amazonaws.com/test-bucket/organization-icons/1234567890-organization-logo.png',
      bucket: 'organization-icon',
    };

    beforeEach(() => {
      // Set environment variable for bucket name
      process.env.ORGANIZATION_ICON_BUCKET = 'organization-icon';
    });

    afterEach(() => {
      delete process.env.ORGANIZATION_ICON_BUCKET;
    });

    it('should upload organization icon successfully', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(mockUploadResult);

      const updatedOrganization = {
        ...mockOrganization,
        icon: mockUploadResult.url,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrismaTransaction = {
          organizationChild: {
            update: jest.fn().mockResolvedValue(updatedOrganization),
          },
        };
        return callback(mockPrismaTransaction);
      });

      // Act
      const result = await service.updateOrganizationIcon(orgId, mockFile);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: orgId },
        include: {
          organizationParents: true,
          events: {
            include: {
              TicketCategories: true,
            },
          },
        },
      });

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith({
        buffer: mockFile.buffer,
        fileName: mockFile.originalname,
        folder: 'organization-icons',
        contentType: mockFile.mimetype,
        bucketName: 'organization-icon',
      });

      expect(result).toEqual({
        message: 'Organization icon updated successfully',
        organization: updatedOrganization,
      });
    });

    it('should use fallback bucket name when ORGANIZATION_ICON_BUCKET is not set', async () => {
      // Arrange
      delete process.env.ORGANIZATION_ICON_BUCKET;
      process.env.AWS_ASSETS_BUCKET_NAME = 'fallback-bucket';

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(mockUploadResult);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrismaTransaction = {
          organizationChild: {
            update: jest.fn().mockResolvedValue(mockOrganization),
          },
        };
        return callback(mockPrismaTransaction);
      });

      // Act
      await service.updateOrganizationIcon(orgId, mockFile);

      // Assert
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: 'fallback-bucket',
        }),
      );

      delete process.env.AWS_ASSETS_BUCKET_NAME;
    });

    it('should throw HttpException when organization not found', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(
        new HttpException('Organization not found', HttpStatus.NOT_FOUND),
      );

      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw HttpException when bucket is not configured', async () => {
      // Arrange
      delete process.env.ORGANIZATION_ICON_BUCKET;
      delete process.env.AWS_ASSETS_BUCKET_NAME;

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(
        new HttpException(
          'Storage bucket not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );

      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw HttpException when S3 upload fails', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organizationChild: {
            update: jest.fn(),
          },
        });
      });

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(
        new HttpException(
          'Failed to upload Organization icon',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException when S3 upload returns no URL', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue({
        key: 'test-key',
        url: '',
        bucket: 'test-bucket',
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organizationChild: {
            update: jest.fn(),
          },
        });
      });

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(
        new HttpException(
          'Failed to upload Organization icon',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle database errors during transaction', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(mockUploadResult);

      const dbError = new Error('Database connection failed');
      mockPrismaService.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(
        new HttpException(
          'Database connection failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should re-throw HttpException without wrapping', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );

      const customException = new HttpException(
        'Custom S3 error',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      mockS3Service.uploadFile.mockRejectedValue(customException);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organizationChild: {
            update: jest.fn(),
          },
        });
      });

      // Act & Assert
      await expect(
        service.updateOrganizationIcon(orgId, mockFile),
      ).rejects.toThrow(customException);
    });

    it('should update organization with new icon URL in database', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(mockUploadResult);

      const updatedOrganization = {
        ...mockOrganization,
        icon: mockUploadResult.url,
      };

      const mockUpdate = jest.fn().mockResolvedValue(updatedOrganization);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockPrismaTransaction = {
          organizationChild: {
            update: mockUpdate,
          },
        };
        return callback(mockPrismaTransaction);
      });

      // Act
      await service.updateOrganizationIcon(orgId, mockFile);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { icon: mockUploadResult.url },
      });
    });

    it('should handle different file types', async () => {
      // Arrange
      const jpegFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
      };

      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );
      mockS3Service.uploadFile.mockResolvedValue(mockUploadResult);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          organizationChild: {
            update: jest.fn().mockResolvedValue(mockOrganization),
          },
        });
      });

      // Act
      await service.updateOrganizationIcon(orgId, jpegFile);

      // Assert
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/jpeg',
          fileName: 'logo.jpg',
        }),
      );
    });
  });

  describe('findAll', () => {
    const mockOrganizations = [
      {
        id: 'org_1',
        name: 'Organization 1',
        acronym: 'ORG1',
        isArchived: false,
        organizationParents: [],
        events: [],
      },
      {
        id: 'org_2',
        name: 'Organization 2',
        acronym: 'ORG2',
        isArchived: false,
        organizationParents: [],
        events: [],
      },
    ];

    it('should return paginated organizations successfully', async () => {
      // Arrange
      const query = {
        page: 1,
        limit: 10,
        searchFilter: 'test',
        orderBy: 'asc' as 'asc' | 'desc',
      };
      mockPrismaService.organizationChild.findMany.mockResolvedValue(
        mockOrganizations,
      );

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        {
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { acronym: { contains: 'test', mode: 'insensitive' } },
            ],
            isArchived: false,
          },
          skip: 0,
          take: 10,
          orderBy: { name: 'asc' },
          include: {
            organizationParents: true,
            events: {
              include: {
                registrations: true,
                ticketCategories: true,
              },
            },
          },
        },
      );

      expect(result).toEqual({
        message: 'Organizations fetched successfully',
        data: mockOrganizations,
        page: 1,
        limit: 10,
      });
    });

    it('should return organizations with default pagination when no query params provided', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockResolvedValue(
        mockOrganizations,
      );

      // Act
      const result = await service.findAll({});

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        {
          where: { isArchived: false },
          skip: 0,
          take: 10,
          orderBy: { name: 'asc' },
          include: {
            organizationParents: true,
            events: {
              include: {
                registrations: true,
                ticketCategories: true,
              },
            },
          },
        },
      );

      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should calculate correct pagination skip value', async () => {
      // Arrange
      const query = { page: 3, limit: 5 };
      mockPrismaService.organizationChild.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (3-1) * 5 = 10
          take: 5,
        }),
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.findAll({})).rejects.toThrow(
        new HttpException(
          'Error fetching organizations',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should filter out archived organizations', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockResolvedValue(
        mockOrganizations,
      );

      // Act
      await service.findAll({});

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: false,
          }),
        }),
      );
    });
  });

  describe('findAllOrganizationsWithoutFilters', () => {
    const mockOrganizations = [
      { id: 'org_1', name: 'Organization 1', isArchived: false },
      { id: 'org_2', name: 'Organization 2', isArchived: false },
    ];

    it('should return all active organizations without filters', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockResolvedValue(
        mockOrganizations,
      );

      // Act
      const result = await service.findAllOrganizationsWithoutFilters();

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        {
          where: { isArchived: false },
        },
      );

      expect(result).toEqual({
        message: 'Organizations fetched successfully',
        data: mockOrganizations,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        service.findAllOrganizationsWithoutFilters(),
      ).rejects.toThrow(
        new HttpException(
          'Error fetching organizations',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should exclude archived organizations', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockResolvedValue([]);

      // Act
      await service.findAllOrganizationsWithoutFilters();

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        {
          where: { isArchived: false },
        },
      );
    });
  });

  describe('findAllByOrganizationParent', () => {
    const parentId = 'parent_123';
    const mockOrganizationGroups = [
      {
        organizationChild: {
          id: 'org_1',
          name: 'Child Org 1',
          organizationParents: [],
          events: [],
        },
      },
      {
        organizationChild: {
          id: 'org_2',
          name: 'Child Org 2',
          organizationParents: [],
          events: [],
        },
      },
    ];

    it('should return organizations by parent with pagination', async () => {
      // Arrange
      const query = { page: 2, limit: 5 };
      mockPrismaService.organizationGroup.findMany.mockResolvedValue(
        mockOrganizationGroups,
      );

      // Act
      const result = await service.findAllByOrganizationParent(parentId, query);

      // Assert
      expect(mockPrismaService.organizationGroup.findMany).toHaveBeenCalledWith(
        {
          where: {
            organizationParentId: parentId,
            organizationChild: { isArchived: false },
          },
          skip: 5, // (2-1) * 5
          take: 5,
          include: {
            organizationChild: {
              include: {
                organizationParents: true,
                events: {
                  include: {
                    registrations: true,
                    ticketCategories: true,
                  },
                },
              },
            },
          },
        },
      );

      expect(result).toBe(mockOrganizationGroups);
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      mockPrismaService.organizationGroup.findMany.mockResolvedValue([]);

      // Act
      await service.findAllByOrganizationParent(parentId, {});

      // Assert
      expect(mockPrismaService.organizationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.organizationGroup.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        service.findAllByOrganizationParent(parentId, {}),
      ).rejects.toThrow(
        new HttpException(
          'Error fetching organizations',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should filter out archived organizations in nested query', async () => {
      // Arrange
      mockPrismaService.organizationGroup.findMany.mockResolvedValue([]);

      // Act
      await service.findAllByOrganizationParent(parentId, {});

      // Assert
      expect(mockPrismaService.organizationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationChild: { isArchived: false },
          }),
        }),
      );
    });
  });

  describe('findOneById', () => {
    const orgId = 'org_123';
    const mockOrganization = {
      id: orgId,
      name: 'Test Organization',
      organizationParents: [],
      events: [],
    };

    it('should return organization by id', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );

      // Act
      const result = await service.findOneById(orgId);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: orgId },
        include: {
          organizationParents: true,
          events: {
            include: {
              registrations: true,
              ticketCategories: true,
            },
          },
        },
      });

      expect(result).toBe(mockOrganization);
    });

    it('should throw HttpException when organization not found', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(null);

      // Act
      const findPromise = service.findOneById('nonexistent');

      // Assert
      await expect(findPromise).rejects.toThrow(
        new HttpException('Organization not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should include all necessary relationships', async () => {
      // Arrange
      mockPrismaService.organizationChild.findUnique.mockResolvedValue(
        mockOrganization,
      );

      // Act
      await service.findOneById(orgId);

      // Assert
      expect(
        mockPrismaService.organizationChild.findUnique,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            organizationParents: true,
            events: {
              include: {
                registrations: true,
                ticketCategories: true,
              },
            },
          },
        }),
      );
    });
  });

  describe('findArchivedOrganizations', () => {
    const mockArchivedOrganizations = [
      {
        id: 'archived_org_1',
        name: 'Archived Organization 1',
        isArchived: true,
        organizationParents: [],
        events: [],
      },
    ];

    it('should return archived organizations with pagination', async () => {
      // Arrange
      const query = {
        page: 1,
        limit: 5,
        searchFilter: 'archived',
        orderBy: 'desc' as 'asc' | 'desc',
      };
      mockPrismaService.organizationChild.findMany.mockResolvedValue(
        mockArchivedOrganizations,
      );

      // Act
      const result = await service.findArchivedOrganizations(query);

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        {
          where: {
            OR: [
              { name: { contains: 'archived', mode: 'insensitive' } },
              { acronym: { contains: 'archived', mode: 'insensitive' } },
            ],
            isArchived: true,
          },
          skip: 0,
          take: 5,
          orderBy: { name: 'desc' },
          include: {
            organizationParents: true,
            events: {
              include: {
                registrations: true,
                ticketCategories: true,
              },
            },
          },
        },
      );

      expect(result).toEqual({
        message: 'Archived organizations fetched successfully',
        data: mockArchivedOrganizations,
        page: 1,
        limit: 5,
      });
    });

    it('should filter only archived organizations', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockResolvedValue([]);

      // Act
      await service.findArchivedOrganizations({});

      // Assert
      expect(mockPrismaService.organizationChild.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: true,
          }),
        }),
      );
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.organizationChild.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.findArchivedOrganizations({})).rejects.toThrow(
        new HttpException(
          'Error fetching archived organizations',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
