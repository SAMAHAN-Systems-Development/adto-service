import { Test, TestingModule } from '@nestjs/testing';
import { FormAnswersService } from './form-answers.service';

describe('FormAnswersService', () => {
  let service: FormAnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormAnswersService],
    }).compile();

    service = module.get<FormAnswersService>(FormAnswersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
