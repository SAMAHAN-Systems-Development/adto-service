import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin (Organization) dashboard overview — scoped to an organization.
   */
  async getAdminOverview(orgId: string) {
    const now = new Date();

    const baseWhere = {
      orgId,
      isArchived: false,
      deletedAt: null,
    };

    const [totalEvents, upcomingEvents, ongoingEvents, draftEvents] =
      await Promise.all([
        this.prisma.event.count({ where: baseWhere }),
        this.prisma.event.count({
          where: {
            ...baseWhere,
            dateStart: { gt: now },
          },
        }),
        this.prisma.event.count({
          where: {
            ...baseWhere,
            dateStart: { lte: now },
            dateEnd: { gte: now },
          },
        }),
        this.prisma.event.count({
          where: {
            ...baseWhere,
            isPublished: false,
          },
        }),
      ]);

    return { totalEvents, upcomingEvents, ongoingEvents, draftEvents };
  }

  /**
   * Superadmin dashboard overview — platform-wide metrics.
   */
  async getSuperadminOverview() {
    const now = new Date();

    const baseEventWhere = {
      isArchived: false,
      deletedAt: null,
    };

    const [
      totalOrganizations,
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      draftEvents,
    ] = await Promise.all([
      this.prisma.organizationChild.count({
        where: { isArchived: false },
      }),
      this.prisma.event.count({ where: baseEventWhere }),
      this.prisma.event.count({
        where: {
          ...baseEventWhere,
          dateStart: { gt: now },
        },
      }),
      this.prisma.event.count({
        where: {
          ...baseEventWhere,
          dateStart: { lte: now },
          dateEnd: { gte: now },
        },
      }),
      this.prisma.event.count({
        where: {
          ...baseEventWhere,
          isPublished: false,
        },
      }),
    ]);

    return {
      totalOrganizations,
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      draftEvents,
    };
  }

  /**
   * Admin calendar events — scoped to an organization for a given month/year.
   */
  async getAdminCalendarEvents(
    orgId: string,
    month: number,
    year: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.event.findMany({
      where: {
        orgId,
        isArchived: false,
        deletedAt: null,
        OR: [
          // Events that start within the month
          { dateStart: { gte: startDate, lte: endDate } },
          // Events that end within the month
          { dateEnd: { gte: startDate, lte: endDate } },
          // Events that span across the entire month
          { dateStart: { lte: startDate }, dateEnd: { gte: endDate } },
        ],
      },
      select: {
        id: true,
        name: true,
        dateStart: true,
        dateEnd: true,
        isPublished: true,
      },
      orderBy: { dateStart: 'asc' },
    });
  }

  /**
   * Superadmin calendar events — platform-wide for a given month/year.
   */
  async getSuperadminCalendarEvents(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.event.findMany({
      where: {
        isArchived: false,
        deletedAt: null,
        OR: [
          { dateStart: { gte: startDate, lte: endDate } },
          { dateEnd: { gte: startDate, lte: endDate } },
          { dateStart: { lte: startDate }, dateEnd: { gte: endDate } },
        ],
      },
      select: {
        id: true,
        name: true,
        dateStart: true,
        dateEnd: true,
        isPublished: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dateStart: 'asc' },
    });
  }
}
