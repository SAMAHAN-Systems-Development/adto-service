import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrganizationParentsService } from './organization-parents.service';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('organization-parents')
export class OrganizationParentsController {
  constructor(
    private readonly organizationParentsService: OrganizationParentsService,
  ) {}

  @Post('/create')
  create(@Body() createOrganizationParentDto: CreateOrganizationParentDto) {
    return this.organizationParentsService.create(createOrganizationParentDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.organizationParentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationParentsService.findOne(id);
  }

  @Patch('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizationParentDto: UpdateOrganizationParentDto,
  ) {
    return this.organizationParentsService.update(
      id,
      updateOrganizationParentDto,
    );
  }

  @Delete('remove/:id')
  remove(@Param('id') id: string) {
    return this.organizationParentsService.remove(id);
  }
}
