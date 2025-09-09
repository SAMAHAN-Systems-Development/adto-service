import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthGuard } from '../auth/auth.guard';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: OrganizationsService;

  const mockOrganizationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllOrganizationsWithoutFilters: jest.fn(),
    findAllByOrganizationParent: jest.fn(),
    updateOrganizationIcon: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    archiveOrganizationChild: jest.fn(),
    unarchiveOrganizationChild: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createOrganizationDto: CreateOrganizationDto = {
      name: 'Test Organization',
      email: 'test@example.com',
      password: 'password123',
      acronym: 'TO',
      description: 'Test description',
    };

    const mockCreatedOrganization = {
      message: 'Organization created successfully',
      data: {
        id: 'org_123',
        name: 'Test Organization',
        acronym: 'TO',
        description: 'Test description',
        userId: 'user_123',
      },
      statusCode: HttpStatus.CREATED,
    };

    it('should create an organization successfully', async () => {
      // Arrange
      mockOrganizationsService.create.mockResolvedValue(mockCreatedOrganization);

      // Act
      const result = await controller.create(createOrganizationDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createOrganizationDto);
      expect(result).toEqual(mockCreatedOrganization);
    });

    it('should handle service errors during creation', async () => {
      // Arrange
      const serviceError = new Error('Service error');
      mockOrganizationsService.create.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.create(createOrganizationDto)).rejects.toThrow('Service error');
      expect(service.create).toHaveBeenCalledWith(createOrganizationDto);
    });
  });

  describe('findAll', () => {
    const mockOrganizations = {
      message: 'Organizations fetched successfully',
      data: [
        { id: 'org_1', name: 'Organization 1', acronym: 'ORG1' },
        { id: 'org_2', name: 'Organization 2', acronym: 'ORG2' },
      ],
      page: 1,
      limit: 10,
    };

    it('should return all organizations with default pagination', async () => {
      // Arrange
      mockOrganizationsService.findAll.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        searchFilter: undefined,
        orderBy: 'asc',
      });
      expect(result).toEqual(mockOrganizations);
    });

    it('should return organizations with custom pagination and filters', async () => {
      // Arrange
      mockOrganizationsService.findAll.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAll(2, 5, 'test', 'desc');

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        searchFilter: 'test',
        orderBy: 'desc',
      });
      expect(result).toEqual(mockOrganizations);
    });

    it('should handle invalid number inputs gracefully', async () => {
      // Arrange
      mockOrganizationsService.findAll.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAll(NaN, NaN, '', undefined);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1, // fallback to 1 when NaN
        limit: 10, // fallback to 10 when NaN
        searchFilter: undefined, // empty string becomes undefined
        orderBy: 'asc', // fallback to 'asc' when undefined
      });
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('findAllOrganizationsWithoutFilters', () => {
    const mockOrganizations = {
      message: 'Organizations fetched successfully',
      data: [
        { id: 'org_1', name: 'Organization 1' },
        { id: 'org_2', name: 'Organization 2' },
      ],
    };

    it('should return all organizations without filters', async () => {
      // Arrange
      mockOrganizationsService.findAllOrganizationsWithoutFilters.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAllOrganizationsWithoutFilters();

      // Assert
      expect(service.findAllOrganizationsWithoutFilters).toHaveBeenCalledWith();
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('findAllByOrganizationParent', () => {
    const parentId = 'parent_123';
    const mockOrganizations = [
      {
        organizationChild: {
          id: 'org_1',
          name: 'Child Organization 1',
        },
      },
    ];

    it('should return organizations by parent with default pagination', async () => {
      // Arrange
      mockOrganizationsService.findAllByOrganizationParent.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAllByOrganizationParent(parentId);

      // Assert
      expect(service.findAllByOrganizationParent).toHaveBeenCalledWith(parentId, {
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockOrganizations);
    });

    it('should return organizations by parent with custom pagination', async () => {
      // Arrange
      mockOrganizationsService.findAllByOrganizationParent.mockResolvedValue(mockOrganizations);

      // Act
      const result = await controller.findAllByOrganizationParent(parentId, 2, 5);

      // Assert
      expect(service.findAllByOrganizationParent).toHaveBeenCalledWith(parentId, {
        page: 2,
        limit: 5,
      });
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('uploadOrganizationIcon', () => {
    const orgId = 'org_123';
    const mockFile = {
      fieldname: 'icon',
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 50000,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const mockUploadResult = {
      message: 'Icon uploaded successfully',
      data: {
        id: orgId,
        icon: 'https://example.com/icon.jpg',
      },
    };

    it('should upload organization icon successfully', async () => {
      // Arrange
      mockOrganizationsService.updateOrganizationIcon.mockResolvedValue(mockUploadResult);

      // Act
      const result = await controller.uploadOrganizationIcon(orgId, mockFile);

      // Assert
      expect(service.updateOrganizationIcon).toHaveBeenCalledWith(orgId, mockFile);
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('findOne', () => {
    const orgId = 'org_123';
    const mockOrganization = {
      id: orgId,
      name: 'Test Organization',
      acronym: 'TO',
      organizationParents: [],
      events: [],
    };

    it('should return organization by id', async () => {
      // Arrange
      mockOrganizationsService.findOneById.mockResolvedValue(mockOrganization);

      // Act
      const result = await controller.findOne(orgId);

      // Assert
      expect(service.findOneById).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockOrganization);
    });

    it('should return null when organization not found', async () => {
      // Arrange
      mockOrganizationsService.findOneById.mockResolvedValue(null);

      // Act
      const result = await controller.findOne('nonexistent');

      // Assert
      expect(service.findOneById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const orgId = 'org_123';
    const updateOrganizationDto: UpdateOrganizationDto = {
      name: 'Updated Organization Name',
      acronym: 'UON',
      description: 'Updated description',
    };

    const mockUpdatedOrganization = {
      message: 'Organization updated successfully',
      data: {
        id: orgId,
        name: 'Updated Organization Name',
        acronym: 'UON',
        description: 'Updated description',
      },
      statusCode: HttpStatus.OK,
    };

    it('should update organization successfully', async () => {
      // Arrange
      mockOrganizationsService.update.mockResolvedValue(mockUpdatedOrganization);

      // Act
      const result = await controller.update(orgId, updateOrganizationDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(orgId, updateOrganizationDto);
      expect(result).toEqual(mockUpdatedOrganization);
    });

    it('should handle update with empty dto', async () => {
      // Arrange
      const emptyDto: UpdateOrganizationDto = {};
      mockOrganizationsService.update.mockResolvedValue(mockUpdatedOrganization);

      // Act
      const result = await controller.update(orgId, emptyDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(orgId, emptyDto);
      expect(result).toEqual(mockUpdatedOrganization);
    });
  });

  describe('archiveOrganizationChild', () => {
    const orgId = 'org_123';
    const mockArchivedOrganization = {
      message: 'Organization archived successfully',
      data: {
        id: orgId,
        name: 'Test Organization',
        isArchived: true,
      },
      statusCode: HttpStatus.OK,
    };

    it('should archive organization successfully', async () => {
      // Arrange
      mockOrganizationsService.archiveOrganizationChild.mockResolvedValue(mockArchivedOrganization);

      // Act
      const result = await controller.archiveOrganizationChild(orgId);

      // Assert
      expect(service.archiveOrganizationChild).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockArchivedOrganization);
    });
  });

  describe('unarchiveOrganizationChild', () => {
    const orgId = 'org_123';
    const mockUnarchivedOrganization = {
      message: 'Organization unarchived successfully',
      data: {
        id: orgId,
        name: 'Test Organization',
        isArchived: false,
      },
      statusCode: HttpStatus.OK,
    };

    it('should unarchive organization successfully', async () => {
      // Arrange
      mockOrganizationsService.unarchiveOrganizationChild.mockResolvedValue(mockUnarchivedOrganization);

      // Act
      const result = await controller.unarchiveOrganizationChild(orgId);

      // Assert
      expect(service.unarchiveOrganizationChild).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockUnarchivedOrganization);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors in create method', async () => {
      // Arrange
      const createDto: CreateOrganizationDto = {
        name: 'Test Org',
        email: 'test@example.com',
        password: 'password123',
      };
      const serviceError = new Error('Database connection failed');
      mockOrganizationsService.create.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.create(createDto)).rejects.toThrow('Database connection failed');
    });

    it('should propagate service errors in findAll method', async () => {
      // Arrange
      const serviceError = new Error('Query failed');
      mockOrganizationsService.findAll.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Query failed');
    });

    it('should propagate service errors in update method', async () => {
      // Arrange
      const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };
      const serviceError = new Error('Update failed');
      mockOrganizationsService.update.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.update('org_123', updateDto)).rejects.toThrow('Update failed');
    });

    it('should propagate service errors in archive method', async () => {
      // Arrange
      const serviceError = new Error('Archive failed');
      mockOrganizationsService.archiveOrganizationChild.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.archiveOrganizationChild('org_123')).rejects.toThrow('Archive failed');
    });

    it('should propagate service errors in unarchive method', async () => {
      // Arrange
      const serviceError = new Error('Unarchive failed');
      mockOrganizationsService.unarchiveOrganizationChild.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.unarchiveOrganizationChild('org_123')).rejects.toThrow('Unarchive failed');
    });
  });

  describe('Parameter Type Conversion', () => {
    it('should handle string numbers in pagination parameters', async () => {
      // Arrange
      mockOrganizationsService.findAll.mockResolvedValue({ data: [] });

      // Act
      await controller.findAll('2' as any, '15' as any, 'search', 'desc');

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        searchFilter: 'search',
        orderBy: 'desc',
      });
    });

    it('should handle undefined and null values in findAll', async () => {
      // Arrange
      mockOrganizationsService.findAll.mockResolvedValue({ data: [] });

      // Act
      await controller.findAll(undefined, null as any, null as any, undefined);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1, // Number(undefined) || 1
        limit: 10, // Number(null) || 10
        searchFilter: undefined, // null || undefined
        orderBy: 'asc', // undefined || 'asc'
      });
    });
  });
});