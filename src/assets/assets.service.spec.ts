import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { S3Service } from '../s3/s3.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let s3Service: S3Service;

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
