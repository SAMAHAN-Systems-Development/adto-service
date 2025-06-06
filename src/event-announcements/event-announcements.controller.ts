import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EventAnnouncementsService } from './event-announcements.service';
import { CreateEventAnnouncementDto } from './dto/create-event-announcement.dto';
import { UpdateEventAnnouncementDto } from './dto/update-event-announcement.dto';

@Controller('event-announcements')
export class EventAnnouncementsController {
  constructor(
    private readonly eventAnnouncementsService: EventAnnouncementsService,
  ) {}

  @Post()
  create(@Body() createEventAnnouncementDto: CreateEventAnnouncementDto) {
    return this.eventAnnouncementsService.create(createEventAnnouncementDto);
  }

  @Get('/event/:eventId')
  findAllByEvent(@Param('eventId') eventId: string) {
    return this.eventAnnouncementsService.findAllByEvent(eventId);
  }

  @Get()
  findAll() {
    return this.eventAnnouncementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventAnnouncementsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventAnnouncementDto: UpdateEventAnnouncementDto,
  ) {
    return this.eventAnnouncementsService.update(
      id,
      updateEventAnnouncementDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventAnnouncementsService.remove(id);
  }
}
