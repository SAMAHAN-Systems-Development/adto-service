import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    return this.organizationsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'asc',
    });
  }

  @Get('/organizationParent/:id')
  findAllByOrganizationParent(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.organizationsService.findAllByOrganizationParent(id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Patch('/uploadIcon/:id')
  @UseInterceptors(FileInterceptor('icon'))
  uploadOrganizationIcon(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000000 }),
          new FileTypeValidator({
            fileType: /(image\/jpeg|image\/png)/,
          }),
        ],
      }),
    )
    icon: Express.Multer.File,
  ) {
    return this.organizationsService.updateOrganizationIcon(id, icon);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }
}
