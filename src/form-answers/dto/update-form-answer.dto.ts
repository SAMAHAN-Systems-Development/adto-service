import { PartialType } from '@nestjs/mapped-types';
import { CreateFormAnswerDto } from './create-form-answer.dto';

export class UpdateFormAnswerDto extends PartialType(CreateFormAnswerDto) {}
