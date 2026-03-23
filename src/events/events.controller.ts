import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('events')
@UseGuards(AuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(createEventDto, req.user.orgId);
  }

  @Public()
  @Get('/public')
  async findAllPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRegistrationOpen') isRegistrationOpen?: boolean,
    @Query('isRegistrationRequired') isRegistrationRequired?: boolean,
    @Query('isOpenToOutsiders') isOpenToOutsiders?: boolean,
    @Query('organizationId') organizationId?: string,
    @Query('organizationParentId') organizationParentId?: string,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
    @Query('price') price?: 'free' | 'paid' | 'all',
  ) {
    return this.eventsService.findAll(null, null, {
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      isRegistrationOpen: isRegistrationOpen || undefined,
      isRegistrationRequired: isRegistrationRequired || undefined,
      isOpenToOutsiders: isOpenToOutsiders || undefined,
      searchFilter: searchFilter || undefined,
      organizationId: organizationId || undefined,
      organizationParentId: organizationParentId || undefined,
      orderBy: orderBy || 'asc',
      price: price || undefined,
      eventStatus: 'UPCOMING',
    });
  }

  @Get('/published')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  async findAllPublished(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRegistrationOpen') isRegistrationOpen?: boolean,
    @Query('isRegistrationRequired') isRegistrationRequired?: boolean,
    @Query('isOpenToOutsiders') isOpenToOutsiders?: boolean,
    @Query('organizationId') organizationId?: string,
    @Query('organizationParentId') organizationParentId?: string,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
    @Query('price') price?: 'free' | 'paid' | 'all',
    @Query('eventStatus')
    eventStatus?: 'DRAFT' | 'UPCOMING' | 'FINISHED' | 'ARCHIVED',
  ) {
    const { role, orgId } = req.user;
    return this.eventsService.findAll(role, orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      isRegistrationOpen: isRegistrationOpen || undefined,
      isRegistrationRequired: isRegistrationRequired || undefined,
      isOpenToOutsiders: isOpenToOutsiders || undefined,
      searchFilter: searchFilter || undefined,
      organizationId: organizationId || undefined,
      organizationParentId: organizationParentId || undefined,
      orderBy: orderBy || 'asc',
      price: price || undefined,
      eventStatus: eventStatus || undefined,
    });
  }

  @Patch('/:id/publish')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  publish(@Param('id') id: string) {
    return this.eventsService.publishEvent(id);
  }

  @Patch('/:id/soft-delete')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  softDelete(@Param('id') id: string) {
    return this.eventsService.softDelete(id);
  }

  @Patch('/:id/archive')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  archive(@Param('id') id: string) {
    return this.eventsService.archive(id);
  }

  @Patch('/:id/unarchive')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  unarchive(@Param('id') id: string) {
    return this.eventsService.unarchive(id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Public()
  @Get(':id/stats')
  getEventStats(@Param('id') id: string) {
    return this.eventsService.getEventStats(id);
  }

  @Patch(':id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post(':id/concept-paper')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  @UseInterceptors(FileInterceptor('file'))
  uploadConceptPaper(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 15 }), // 15MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.eventsService.uploadConceptPaper(id, file, req.user);
  }

  @Delete(':id/concept-paper')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  deleteConceptPaper(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.deleteConceptPaper(id, req.user);
  }
}
