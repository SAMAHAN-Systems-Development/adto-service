import { Module } from '@nestjs/common';
import { FormAnswersService } from './form-answers.service';
import { FormAnswersController } from './form-answers.controller';

@Module({
  controllers: [FormAnswersController],
  providers: [FormAnswersService],
})
export class FormAnswersModule {}
