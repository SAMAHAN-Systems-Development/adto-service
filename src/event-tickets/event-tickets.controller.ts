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
} from '@nestjs/common';
import { EventTicketsService } from './event-tickets.service';
import { CreateEventTicketDto } from './dto/create-event-ticket.dto';
import { UpdateEventTicketDto } from './dto/update-event-ticket.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('tickets')
export class EventTicketsController {
  constructor(private readonly eventTicketsService: EventTicketsService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @Roles(UserType.ORGANIZATION)
  create(@Body() createEventTicketDto: CreateEventTicketDto, @Req() req: any) {
    return this.eventTicketsService.create(createEventTicketDto, req.user.orgId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(UserType.ORGANIZATION, UserType.ADMIN)
  findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('eventId') eventId?: string,
  ) {
    return this.eventTicketsService.findAll(req.user.orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      eventId,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(UserType.ORGANIZATION, UserType.ADMIN)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventTicketsService.findOne(id, req.user.orgId);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard)
  @Roles(UserType.ORGANIZATION)
  update(
    @Param('id') id: string,
    @Body() updateEventTicketDto: UpdateEventTicketDto,
    @Req() req: any,
  ) {
    return this.eventTicketsService.update(id, updateEventTicketDto, req.user.orgId);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard)
  @Roles(UserType.ORGANIZATION)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.eventTicketsService.remove(id, req.user.orgId);
  }
}
