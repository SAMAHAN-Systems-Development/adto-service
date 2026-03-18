import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { DeclineEventRequestDto } from './dto/decline-event-request.dto';
import { Prisma, EventRequestStatus, UserType } from '@prisma/client';

@Injectable()
export class EventRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventRequestDto: CreateEventRequestDto, orgId: string) {
    try {
      const { eventId } = createEventRequestDto;
      
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (event.orgId !== orgId) {
        throw new ForbiddenException("You can only request approval for your own organization's events");
      }

      if (!event.conceptPaperUrl) {
        throw new BadRequestException('A concept paper must be uploaded before requesting approval');
      }

      const existingRequest = await this.prisma.eventRequest.findUnique({
        where: { eventId: eventId },
      });

      if (existingRequest) {
        if (existingRequest.status === EventRequestStatus.APPROVED) {
           throw new BadRequestException('This event is already approved');
        }
        if (existingRequest.status === EventRequestStatus.PENDING) {
           throw new BadRequestException('A pending request already exists for this event');
        }

        // If DENIED, we can resubmit by reverting back to PENDING
        const updatedRequest = await this.prisma.eventRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: EventRequestStatus.PENDING,
            remark: null,
          },
        });

        return {
          message: 'Event request resubmitted successfully',
          data: updatedRequest,
          statusCode: HttpStatus.OK,
        };
      }

      const newRequest = await this.prisma.eventRequest.create({
        data: {
          orgId: orgId,
          eventId: eventId,
        },
      });

      return {
        message: 'Event request created successfully',
        data: newRequest,
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to create event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(
    role: UserType | null,
    orgId: string | null,
    query: {
      page?: number;
      limit?: number;
      status?: EventRequestStatus;
      searchFilter?: string;
      organizationId?: string;
      eventId?: string;
      orderBy?: 'asc' | 'desc';
    },
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      searchFilter,
      organizationId,
      eventId,
      orderBy = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const effectiveOrgId = role === UserType.ORGANIZATION && orgId ? orgId : organizationId;

    const where: Prisma.EventRequestWhereInput = {
      ...(status !== undefined && { status }),
      ...(effectiveOrgId && { orgId: effectiveOrgId }),
      ...(eventId && { eventId }),

      ...(searchFilter && {
        OR: [
          {
            event: {
              name: { contains: searchFilter, mode: 'insensitive' },
            },
          },
          {
            org: {
              name: { contains: searchFilter, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const eventRequests = await this.prisma.eventRequest.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: orderBy },
      include: {
        event: {
          select: { id: true, name: true, conceptPaperUrl: true },
        },
        org: {
          select: { id: true, name: true, acronym: true, icon: true },
        },
      },
    });

    const totalCount = await this.prisma.eventRequest.count({ where });

    return {
      data: eventRequests,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    try {
      const request = await this.prisma.eventRequest.findUnique({
        where: { id: id },
        include: {
          event: {
            select: { id: true, name: true, conceptPaperUrl: true },
          },
          org: {
            select: { id: true, name: true, acronym: true, icon: true },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Event request not found');
      }
      return {
        message: 'Event request retrieved successfully',
        data: request,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to retrieve event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async approve(id: string) {
    try {
      const existing = await this.prisma.eventRequest.findUnique({ where: { id } });

      if (!existing) throw new NotFoundException('Event request not found');
      if (existing.status !== EventRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      const approvedRequest = await this.prisma.eventRequest.update({
        where: { id },
        data: { status: EventRequestStatus.APPROVED },
      });

      return {
        message: 'Event request approved successfully',
        data: approvedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to approve event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async decline(id: string, declineDto: DeclineEventRequestDto) {
    try {
      const { declineReason } = declineDto;
      const existing = await this.prisma.eventRequest.findUnique({ where: { id } });

      if (!existing) throw new NotFoundException('Event request not found');
      if (existing.status !== EventRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be declined');
      }

      const declinedRequest = await this.prisma.eventRequest.update({
        where: { id },
        data: {
          remark: declineReason,
          status: EventRequestStatus.DENIED,
        },
      });
      
      await this.prisma.event.update({
        where: { id: existing.eventId },
        data: { isPublished: false }
      });

      return {
        message: 'Event request declined successfully',
        data: declinedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to decline event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async cancel(id: string, orgId: string) {
    try {
      const existing = await this.prisma.eventRequest.findUnique({ where: { id } });

      if (!existing) throw new NotFoundException('Event request not found');
      if (existing.orgId !== orgId) throw new ForbiddenException('You can only cancel your own requests');
      if (existing.status !== EventRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be cancelled');
      }

      await this.prisma.eventRequest.delete({ where: { id } });

      return {
        message: 'Event request cancelled successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to cancel event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async revert(id: string) {
    try {
      const existing = await this.prisma.eventRequest.findUnique({ where: { id } });

      if (!existing) throw new NotFoundException('Event request not found');
      if (existing.status === EventRequestStatus.PENDING) {
        throw new BadRequestException('Request is already pending');
      }

      const revertedRequest = await this.prisma.eventRequest.update({
        where: { id },
        data: {
          status: EventRequestStatus.PENDING,
          remark: null,
        },
      });
      
      await this.prisma.event.update({
        where: { id: existing.eventId },
        data: { isPublished: false }
      });

      return {
        message: 'Event request reverted to pending successfully',
        data: revertedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to revert event request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
