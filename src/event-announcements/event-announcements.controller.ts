import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventAnnouncementsService } from './event-announcements.service';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('event-announcements')
@UseGuards(AuthGuard)
export class EventAnnouncementsController {
  constructor(
    private readonly eventAnnouncementsService: EventAnnouncementsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEventAnnouncementDto: CreateEventAnnouncementDto, @Request() req) {
    return this.eventAnnouncementsService.create(createEventAnnouncementDto, req.user);
  }

  // @Get('/event/:eventId')
  // findAllByEvent(@Param('eventId') eventId: string, @Request() req) {
  //   return this.eventAnnouncementsService.findAllByEvent(eventId, req.user);
  // }

  @Get()
  findAll(
    @Query('eventId') eventId?: string,
    @Query('organizationId') organizationId?: string,
    @Request() req?
  ) {
    return this.eventAnnouncementsService.findAll({
      eventId,
      organizationId,
      user: req.user,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.eventAnnouncementsService.findOne(id, req.user);
  }

  @Patch('/update/:id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateEventAnnouncementDto: UpdateEventAnnouncementDto,
    @Request() req,
  ) {
    return this.eventAnnouncementsService.update(id, updateEventAnnouncementDto, req.user);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req) {
    return this.eventAnnouncementsService.remove(id, req.user);
  }
}