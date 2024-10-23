import { Injectable } from '@nestjs/common';
import { CreateFormQuestionsChoiceDto } from './dto/create-form-questions-choice.dto';
import { UpdateFormQuestionsChoiceDto } from './dto/update-form-questions-choice.dto';

@Injectable()
export class FormQuestionsChoicesService {
  create(createFormQuestionsChoiceDto: CreateFormQuestionsChoiceDto) {
    return 'This action adds a new formQuestionsChoice';
  }

  findAll() {
    return `This action returns all formQuestionsChoices`;
  }

  findOne(id: number) {
    return `This action returns a #${id} formQuestionsChoice`;
  }

  update(id: number, updateFormQuestionsChoiceDto: UpdateFormQuestionsChoiceDto) {
    return `This action updates a #${id} formQuestionsChoice`;
  }

  remove(id: number) {
    return `This action removes a #${id} formQuestionsChoice`;
  }
}
