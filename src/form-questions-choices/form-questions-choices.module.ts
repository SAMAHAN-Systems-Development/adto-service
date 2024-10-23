import { Module } from '@nestjs/common';
import { FormQuestionsChoicesService } from './form-questions-choices.service';
import { FormQuestionsChoicesController } from './form-questions-choices.controller';

@Module({
  controllers: [FormQuestionsChoicesController],
  providers: [FormQuestionsChoicesService],
})
export class FormQuestionsChoicesModule {}
