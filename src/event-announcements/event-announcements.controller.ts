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
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';


@Controller('event-announcements')
@UseGuards(AuthGuard)
export class EventAnnouncementsController {
  constructor(
    private readonly eventAnnouncementsService: EventAnnouncementsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.ORGANIZATION)
  create(@Body() createEventAnnouncementDto: CreateEventAnnouncementDto) {
    return this.eventAnnouncementsService.create(createEventAnnouncementDto);
  }

  // @Get('/event/:eventId')
  // findAllByEvent(@Param('eventId') eventId: string, @Request() req) {
  //   return this.eventAnnouncementsService.findAllByEvent(eventId, req.user);
  // }

  @Get()
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findAll(
    @Query('eventId') eventId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.eventAnnouncementsService.findAll({
      eventId,
      organizationId,
    });
  }

  @Public()
  @Get('public')
  findAllByEvent(
    @Query('eventId') eventId?: string,
  ) {
    return this.eventAnnouncementsService.findAllByEvent(
      eventId,
    );
  }

  @Get(':id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findOne(@Param('id') id: string) {
    return this.eventAnnouncementsService.findOne(id);
  }

  @Patch('/update/:id')
  @Roles(UserType.ORGANIZATION)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateEventAnnouncementDto: UpdateEventAnnouncementDto,
  ) {
    return this.eventAnnouncementsService.update(id, updateEventAnnouncementDto);
  }

  @Delete('/delete/:id')
  @Roles(UserType.ORGANIZATION)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.eventAnnouncementsService.remove(id);
  }
}