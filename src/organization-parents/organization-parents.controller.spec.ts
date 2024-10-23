import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationParentsController } from './organization-parents.controller';
import { OrganizationParentsService } from './organization-parents.service';

describe('OrganizationParentsController', () => {
  let controller: OrganizationParentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationParentsController],
      providers: [OrganizationParentsService],
    }).compile();

    controller = module.get<OrganizationParentsController>(OrganizationParentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
