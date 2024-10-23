import { Test, TestingModule } from '@nestjs/testing';
import { FormQuestionsService } from './form-questions.service';

describe('FormQuestionsService', () => {
  let service: FormQuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormQuestionsService],
    }).compile();

    service = module.get<FormQuestionsService>(FormQuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
