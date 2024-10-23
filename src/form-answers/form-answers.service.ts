import { Injectable } from '@nestjs/common';
import { CreateFormAnswerDto } from './dto/create-form-answer.dto';
import { UpdateFormAnswerDto } from './dto/update-form-answer.dto';

@Injectable()
export class FormAnswersService {
  create(createFormAnswerDto: CreateFormAnswerDto) {
    return 'This action adds a new formAnswer';
  }

  findAll() {
    return `This action returns all formAnswers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} formAnswer`;
  }

  update(id: number, updateFormAnswerDto: UpdateFormAnswerDto) {
    return `This action updates a #${id} formAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} formAnswer`;
  }
}
