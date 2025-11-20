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

@Controller('tickets')
export class EventTicketsController {
  constructor(private readonly eventTicketsService: EventTicketsService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  create(@Body() createEventTicketDto: CreateEventTicketDto, @Req() req: any) {
    return this.eventTicketsService.create(createEventTicketDto, req.user.orgId);
  }

  @Get()
  @UseGuards(AuthGuard)
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
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.eventTicketsService.findOne(id, req.user.orgId);
  }

  @Patch('update/:id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEventTicketDto: UpdateEventTicketDto,
    @Req() req: any,
  ) {
    return this.eventTicketsService.update(id, updateEventTicketDto, req.user.orgId);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.eventTicketsService.remove(id, req.user.orgId);
  }
}
