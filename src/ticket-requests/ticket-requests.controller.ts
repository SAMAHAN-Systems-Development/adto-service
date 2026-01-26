import { Controller, Get, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { ApproveTicketRequestDto } from './dto/approve-ticket.dto';

@Controller('ticket-requests')
export class TicketRequestsController {
  constructor(private readonly ticketRequestsService: TicketRequestsService) {}

  @Post('create')
  create(
    @Body() createTicketRequestDto: CreateTicketRequestDto,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    return this.ticketRequestsService.create(createTicketRequestDto, orgId);
  }

  @Get()
  findAll() {
    return this.ticketRequestsService.findAll();
  }

  @Get('find/:id')
  findOne(@Param('id') id: string) {
    return this.ticketRequestsService.findOne(id);
  }

  @Patch('approve/:id')
  approve(
    @Param('id') id: string,
    @Body() ApproveTicketRequestDto: ApproveTicketRequestDto,
  ) {
    return this.ticketRequestsService.approve(id, ApproveTicketRequestDto);
  }
}
