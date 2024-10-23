import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FormAnswersService } from './form-answers.service';
import { CreateFormAnswerDto } from './dto/create-form-answer.dto';
import { UpdateFormAnswerDto } from './dto/update-form-answer.dto';

@Controller('form-answers')
export class FormAnswersController {
  constructor(private readonly formAnswersService: FormAnswersService) {}

  @Post()
  create(@Body() createFormAnswerDto: CreateFormAnswerDto) {
    return this.formAnswersService.create(createFormAnswerDto);
  }

  @Get()
  findAll() {
    return this.formAnswersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formAnswersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormAnswerDto: UpdateFormAnswerDto) {
    return this.formAnswersService.update(+id, updateFormAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formAnswersService.remove(+id);
  }
}
