import { Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import { OrganizationParentsService } from './organization-parents.service';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';

@Controller('organization-parents')
export class OrganizationParentsController {
  constructor(private readonly organizationParentsService: OrganizationParentsService) {}

  @Post()
  create(@Body() createOrganizationParentDto: CreateOrganizationParentDto) {
    return this.organizationParentsService.create(createOrganizationParentDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    return this.organizationParentsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'asc',
    });
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationParentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganizationParentDto: UpdateOrganizationParentDto) {
    return this.organizationParentsService.update(+id, updateOrganizationParentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationParentsService.remove(+id);
  }
}
