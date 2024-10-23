import { PartialType } from '@nestjs/mapped-types';
import { CreateFormQuestionDto } from './create-form-question.dto';

export class UpdateFormQuestionDto extends PartialType(CreateFormQuestionDto) {}
