import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/overview')
  @Roles(UserType.ORGANIZATION)
  async getAdminOverview(@Req() req: any) {
    return await this.dashboardService.getAdminOverview(req.user.orgId);
  }

  @Get('superadmin/overview')
  @Roles(UserType.ADMIN)
  async getSuperadminOverview() {
    return await this.dashboardService.getSuperadminOverview();
  }

  @Get('admin/calendar')
  @Roles(UserType.ORGANIZATION)
  async getAdminCalendarEvents(
    @Req() req: any,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return await this.dashboardService.getAdminCalendarEvents(
      req.user.orgId,
      Number(month),
      Number(year),
    );
  }

  @Get('superadmin/calendar')
  @Roles(UserType.ADMIN)
  async getSuperadminCalendarEvents(
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return await this.dashboardService.getSuperadminCalendarEvents(
      Number(month),
      Number(year),
    );
  }
}
