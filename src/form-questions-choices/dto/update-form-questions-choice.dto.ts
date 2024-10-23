import { PartialType } from '@nestjs/mapped-types';
import { CreateFormQuestionsChoiceDto } from './create-form-questions-choice.dto';

export class UpdateFormQuestionsChoiceDto extends PartialType(CreateFormQuestionsChoiceDto) {}
