import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationParentsService } from './organization-parents.service';

describe('OrganizationParentsService', () => {
  let service: OrganizationParentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationParentsService],
    }).compile();

    service = module.get<OrganizationParentsService>(OrganizationParentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
