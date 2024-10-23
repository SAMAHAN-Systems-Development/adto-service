import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FormQuestionsChoicesService } from './form-questions-choices.service';
import { CreateFormQuestionsChoiceDto } from './dto/create-form-questions-choice.dto';
import { UpdateFormQuestionsChoiceDto } from './dto/update-form-questions-choice.dto';

@Controller('form-questions-choices')
export class FormQuestionsChoicesController {
  constructor(private readonly formQuestionsChoicesService: FormQuestionsChoicesService) {}

  @Post()
  create(@Body() createFormQuestionsChoiceDto: CreateFormQuestionsChoiceDto) {
    return this.formQuestionsChoicesService.create(createFormQuestionsChoiceDto);
  }

  @Get()
  findAll() {
    return this.formQuestionsChoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formQuestionsChoicesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormQuestionsChoiceDto: UpdateFormQuestionsChoiceDto) {
    return this.formQuestionsChoicesService.update(+id, updateFormQuestionsChoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formQuestionsChoicesService.remove(+id);
  }
}
