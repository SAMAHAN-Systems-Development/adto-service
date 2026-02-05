import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketRequestsService } from './ticket-requests.service';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { ApproveTicketRequestDto } from './dto/approve-ticket.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserType } from '@prisma/client';
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
    @Query('organizationId') OrganizationId?: string,
    @Query('isApproved') isApproved?: boolean,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ) {
    const { role, orgId } = req.user;
    return this.ticketRequestsService.findAll(role, orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      organizationId: OrganizationId || undefined,
      isApproved: isApproved || undefined,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'asc',
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
    @Body() ApproveTicketRequestDto: ApproveTicketRequestDto,
  ) {
    return this.ticketRequestsService.approve(id, ApproveTicketRequestDto);
  }
}
