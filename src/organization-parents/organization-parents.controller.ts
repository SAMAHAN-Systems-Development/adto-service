import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganizationParentsService } from './organization-parents.service';
import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';
import { Public } from 'src/auth/public.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('organization-parents')
@UseGuards(AuthGuard)
export class OrganizationParentsController {
  constructor(
    private readonly organizationParentsService: OrganizationParentsService,
  ) {}

  @Post('/create')
  @Roles(UserType.ADMIN)
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
  @Roles(UserType.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateOrganizationParentDto: UpdateOrganizationParentDto,
  ) {
    return this.organizationParentsService.update(
      id,
      updateOrganizationParentDto,
    );
  }

  @Roles(UserType.ADMIN)
  @Delete('remove/:id')
  remove(@Param('id') id: string) {
    return this.organizationParentsService.remove(id);
  }
}
