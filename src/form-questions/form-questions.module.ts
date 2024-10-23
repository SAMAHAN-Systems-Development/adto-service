import { Module } from '@nestjs/common';
import { FormQuestionsService } from './form-questions.service';
import { FormQuestionsController } from './form-questions.controller';

@Module({
  controllers: [FormQuestionsController],
  providers: [FormQuestionsService],
})
export class FormQuestionsModule {}
