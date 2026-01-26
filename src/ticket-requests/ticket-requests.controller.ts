import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { UpdateTicketRequestDto } from './dto/update-ticket-request.dto';

@Controller('ticket-requests')
export class TicketRequestsController {
  constructor(private readonly ticketRequestsService: TicketRequestsService) {}

  @Post()
  create(@Body() createTicketRequestDto: CreateTicketRequestDto) {
    return this.ticketRequestsService.create(createTicketRequestDto);
  }

  @Get()
  findAll() {
    return this.ticketRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketRequestDto: UpdateTicketRequestDto) {
    return this.ticketRequestsService.update(+id, updateTicketRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketRequestsService.remove(+id);
  }
}
