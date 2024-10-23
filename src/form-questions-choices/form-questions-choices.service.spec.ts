import { Test, TestingModule } from '@nestjs/testing';
import { FormQuestionsChoicesService } from './form-questions-choices.service';

describe('FormQuestionsChoicesService', () => {
  let service: FormQuestionsChoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormQuestionsChoicesService],
    }).compile();

    service = module.get<FormQuestionsChoicesService>(FormQuestionsChoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
