import { Test, TestingModule } from '@nestjs/testing';
import { FormQuestionsChoicesController } from './form-questions-choices.controller';
import { FormQuestionsChoicesService } from './form-questions-choices.service';

describe('FormQuestionsChoicesController', () => {
  let controller: FormQuestionsChoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormQuestionsChoicesController],
      providers: [FormQuestionsChoicesService],
    }).compile();

    controller = module.get<FormQuestionsChoicesController>(FormQuestionsChoicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
