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
import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { DeclineEventRequestDto } from './dto/decline-event-request.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { EventRequestStatus, UserType } from '@prisma/client';
import { Roles } from 'src/auth/roles.decorator';

@Controller('event-requests')
@UseGuards(AuthGuard)
export class EventRequestsController {
  constructor(private readonly eventRequestsService: EventRequestsService) {}

  @Post('create')
  @Roles(UserType.ORGANIZATION)
  create(
    @Body() createEventRequestDto: CreateEventRequestDto,
    @Req() req: any,
  ) {
    const orgId = req.user.orgId;
    return this.eventRequestsService.create(createEventRequestDto, orgId);
  }

  @Get()
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: EventRequestStatus,
    @Query('searchFilter') searchFilter?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
    @Query('eventId') eventId?: string,
  ) {
    const { role, orgId } = req.user;
    return this.eventRequestsService.findAll(role, orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      organizationId: organizationId || undefined,
      status: status || undefined,
      searchFilter: searchFilter || undefined,
      orderBy: orderBy || 'desc',
      eventId: eventId || undefined,
    });
  }

  @Get('find/:id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findOne(@Param('id') id: string) {
    return this.eventRequestsService.findOne(id);
  }

  @Patch('approve/:id')
  @Roles(UserType.ADMIN)
  approve(@Param('id') id: string) {
    return this.eventRequestsService.approve(id);
  }

  @Patch('decline/:id')
  @Roles(UserType.ADMIN)
  decline(
    @Param('id') id: string,
    @Body() declineEventRequestDto: DeclineEventRequestDto,
  ) {
    return this.eventRequestsService.decline(id, declineEventRequestDto);
  }

  @Delete('cancel/:id')
  @Roles(UserType.ORGANIZATION)
  cancel(@Param('id') id: string, @Req() req: any) {
    const orgId = req.user.orgId;
    return this.eventRequestsService.cancel(id, orgId);
  }

  @Patch('revert/:id')
  @Roles(UserType.ADMIN)
  revert(@Param('id') id: string) {
    return this.eventRequestsService.revert(id);
  }
}
