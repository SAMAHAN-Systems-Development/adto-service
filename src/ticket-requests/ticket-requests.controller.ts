import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { ApproveTicketRequestDto } from './dto/approve-ticket.dto';
import { DeclineTicketRequestDto } from './dto/decline-ticket.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { TicketRequestStatus, UserType } from '@prisma/client';
import { Roles } from 'src/auth/roles.decorator';

@Controller('ticket-requests')
@UseGuards(AuthGuard)
export class TicketRequestsController {
  constructor(private readonly ticketRequestsService: TicketRequestsService) {}

  @Post('create')
  @Roles(UserType.ORGANIZATION)
  create(
    @Body() createTicketRequestDto: CreateTicketRequestDto,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    return this.ticketRequestsService.create(createTicketRequestDto, orgId);
  }

  @Get()
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: TicketRequestStatus,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    const { role, orgId } = req.user;
    return this.ticketRequestsService.findAll(role, orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      organizationId: organizationId || undefined,
      status: status || undefined,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'desc',
    });
  }

  @Get('find/:id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findOne(@Param('id') id: string) {
    return this.ticketRequestsService.findOne(id);
  }

  @Patch('approve/:id')
  @Roles(UserType.ADMIN)
  approve(
    @Param('id') id: string,
    @Body() approveTicketRequestDto: ApproveTicketRequestDto,
  ) {
    return this.ticketRequestsService.approve(id, approveTicketRequestDto);
  }

  @Patch('decline/:id')
  @Roles(UserType.ADMIN)
  decline(
    @Param('id') id: string,
    @Body() declineTicketRequestDto: DeclineTicketRequestDto,
  ) {
    return this.ticketRequestsService.decline(id, declineTicketRequestDto);
  }

  @Delete('cancel/:id')
  @Roles(UserType.ORGANIZATION)
  cancel(@Param('id') id: string, @Req() req: any) {
    const orgId = req.user.orgId;
    return this.ticketRequestsService.cancel(id, orgId);
  }

  @Patch('revert/:id')
  @Roles(UserType.ADMIN)
  revert(@Param('id') id: string) {
    return this.ticketRequestsService.revert(id);
  }
}
