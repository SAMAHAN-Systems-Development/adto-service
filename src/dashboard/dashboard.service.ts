import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats() {
    // Count total active organizations (not archived)
    const totalOrganizations = await this.prisma.organizationChild.count({
      where: {
        isArchived: false,
      },
    });

    // Count upcoming events (not archived, not deleted, and start date is in the future)
    const upcomingEvents = await this.prisma.event.count({
      where: {
        isArchived: false,
        deletedAt: null,
        dateStart: {
          gte: new Date(), // Greater than or equal to current date
        },
      },
    });

    return {
      totalOrganizations,
      upcomingEvents,
    };
  }
}
