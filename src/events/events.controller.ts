import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventsService.create(createEventDto, req.user.orgId);
  }

  @Get('/published')
  async findAllPublished(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRegistrationOpen') isRegistrationOpen?: boolean,
    @Query('isRegistrationRequired') isRegistrationRequired?: boolean,
    @Query('isOpenToOutsiders') isOpenToOutsiders?: boolean,
    @Query('organizationId') organizationId?: string,
    @Query('organizationParentId') organizationParentId?: string,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    return this.eventsService.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 12,
      isRegistrationOpen: isRegistrationOpen || undefined,
      isRegistrationRequired: isRegistrationRequired || undefined,
      isOpenToOutsiders: isOpenToOutsiders || undefined,
      searchFilter: searchFilter || undefined,
      organizationId: organizationId || undefined,
      organizationParentId: organizationParentId || undefined,
      orderBy: orderBy || 'asc',
    });
  }

  @Get('/organization/:id')
  async findAllByOrganizationChild(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRegistrationOpen') isRegistrationOpen?: boolean,
    @Query('isRegistrationRequired') isRegistrationRequired?: boolean,
    @Query('isOpenToOutsiders') isOpenToOutsiders?: boolean,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    return this.eventsService.findAllByOrganizationChild(id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      isRegistrationOpen: isRegistrationOpen || undefined,
      isRegistrationRequired: isRegistrationRequired || undefined,
      isOpenToOutsiders: isOpenToOutsiders || undefined,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'asc',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // @Patch(':id')
  // publish(@Param('id') id: string) {
  //   return this.eventsService.publishEvent(id);
  // }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Patch('/:id/soft-delete')
  @UseGuards(AuthGuard)
  softDelete(@Param('id') id: string) {
    return this.eventsService.softDelete(id);
  }

  @Patch('/:id/archive')
  @UseGuards(AuthGuard)
  archive(@Param('id') id: string) {
    return this.eventsService.archive(id);
  }
}
