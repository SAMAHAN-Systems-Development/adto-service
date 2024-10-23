import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FormQuestionsService } from './form-questions.service';
import { CreateFormQuestionDto } from './dto/create-form-question.dto';
import { UpdateFormQuestionDto } from './dto/update-form-question.dto';

@Controller('form-questions')
export class FormQuestionsController {
  constructor(private readonly formQuestionsService: FormQuestionsService) {}

  @Post()
  create(@Body() createFormQuestionDto: CreateFormQuestionDto) {
    return this.formQuestionsService.create(createFormQuestionDto);
  }

  @Get()
  findAll() {
    return this.formQuestionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formQuestionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormQuestionDto: UpdateFormQuestionDto) {
    return this.formQuestionsService.update(+id, updateFormQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formQuestionsService.remove(+id);
  }
}
