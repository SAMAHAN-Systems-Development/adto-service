import { Test, TestingModule } from '@nestjs/testing';
import { FormQuestionsController } from './form-questions.controller';
import { FormQuestionsService } from './form-questions.service';

describe('FormQuestionsController', () => {
  let controller: FormQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormQuestionsController],
      providers: [FormQuestionsService],
    }).compile();

    controller = module.get<FormQuestionsController>(FormQuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
