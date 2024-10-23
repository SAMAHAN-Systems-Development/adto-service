import { Test, TestingModule } from '@nestjs/testing';
import { FormAnswersController } from './form-answers.controller';
import { FormAnswersService } from './form-answers.service';

describe('FormAnswersController', () => {
  let controller: FormAnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormAnswersController],
      providers: [FormAnswersService],
    }).compile();

    controller = module.get<FormAnswersController>(FormAnswersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
