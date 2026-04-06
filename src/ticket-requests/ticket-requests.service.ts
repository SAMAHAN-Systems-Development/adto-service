import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { ApproveTicketRequestDto } from './dto/approve-ticket.dto';
import { DeclineTicketRequestDto } from './dto/decline-ticket.dto';
import { Prisma, TicketRequestStatus, UserType } from '@prisma/client';

@Injectable()
export class TicketRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketRequestDto: CreateTicketRequestDto, orgId: string) {
    try {
      const { ticketId } = createTicketRequestDto;
      await this.ticketOwnedByOrg(ticketId, orgId);
      await this.hasPendingRequest(ticketId, orgId);

      const newTicketRequest = await this.prisma.ticketRequests.create({
        data: {
          orgId: orgId,
          ticketId: ticketId,
        },
      });

      return {
        message: 'Ticket request created successfully',
        data: newTicketRequest,
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      } else if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    role: UserType | null,
    orgId: string | null,
    query: {
      page?: number;
      limit?: number;
      status?: TicketRequestStatus;
      searchFilter?: string;
      organizationId?: string;
      ticketId?: string;
      orderBy?: 'asc' | 'desc';
    },
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      searchFilter,
      organizationId,
      ticketId,
      orderBy = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const effectiveOrgId =
      role === UserType.ORGANIZATION && orgId ? orgId : organizationId;

    const where: Prisma.TicketRequestsWhereInput = {
      ...(status !== undefined && { status }),
      ...(effectiveOrgId && { orgId: effectiveOrgId }),
      ...(ticketId && { ticketId }),

      ...(searchFilter && {
        OR: [
          {
            ticket: {
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

    const ticketRequests = await this.prisma.ticketRequests.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: orderBy,
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        org: {
          select: {
            id: true,
            name: true,
            acronym: true,
            icon: true,
          },
        },
      },
    });

    const totalCount = await this.prisma.ticketRequests.count({ where });

    return {
      data: ticketRequests,
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
      const ticketRequest = await this.prisma.ticketRequests.findUnique({
        where: { id: id },
        include: {
          ticket: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          org: {
            select: {
              id: true,
              name: true,
              acronym: true,
              icon: true,
            },
          },
        },
      });

      if (!ticketRequest) {
        throw new NotFoundException('Ticket request not found');
      }
      return {
        message: 'Ticket request retrieved successfully',
        data: ticketRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approve(id: string, approveTicketRequestDto: ApproveTicketRequestDto) {
    try {
      const { ticketLink, messengerLink } = approveTicketRequestDto;

      const existing = await this.prisma.ticketRequests.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Ticket request not found');
      }

      if (existing.status !== TicketRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      const approvedRequest = await this.prisma.ticketRequests.update({
        where: { id },
        data: {
          ticketLink,
          messengerLink,
          status: TicketRequestStatus.APPROVED,
        },
      });

      return {
        message: 'Ticket request approved successfully',
        data: approvedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to approve ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async decline(id: string, declineTicketRequestDto: DeclineTicketRequestDto) {
    try {
      const { declineReason } = declineTicketRequestDto;

      const existing = await this.prisma.ticketRequests.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Ticket request not found');
      }

      if (existing.status !== TicketRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be declined');
      }

      const declinedRequest = await this.prisma.ticketRequests.update({
        where: { id },
        data: {
          declineReason,
          status: TicketRequestStatus.DECLINED,
        },
      });

      return {
        message: 'Ticket request declined successfully',
        data: declinedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to decline ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancel(id: string, orgId: string) {
    try {
      const existing = await this.prisma.ticketRequests.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Ticket request not found');
      }

      if (existing.orgId !== orgId) {
        throw new ForbiddenException('You can only cancel your own requests');
      }

      if (existing.status !== TicketRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be cancelled');
      }

      await this.prisma.ticketRequests.delete({
        where: { id },
      });

      return {
        message: 'Ticket request cancelled successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revert(id: string) {
    try {
      const existing = await this.prisma.ticketRequests.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException('Ticket request not found');
      }

      if (existing.status === TicketRequestStatus.PENDING) {
        throw new BadRequestException('Request is already pending');
      }

      const revertedRequest = await this.prisma.ticketRequests.update({
        where: { id },
        data: {
          status: TicketRequestStatus.PENDING,
          ticketLink: null,
          declineReason: null,
        },
      });

      return {
        message: 'Ticket request reverted to pending successfully',
        data: revertedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to revert ticket request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async ticketOwnedByOrg(ticketId: string, orgId: string) {
    const ticketOwnedByOrg = await this.prisma.ticketCategory.findFirst({
      where: {
        id: ticketId,
        event: {
          orgId: orgId,
        },
      },
    });

    if (!ticketOwnedByOrg) {
      throw new ForbiddenException(
        'You cannot request a link for a ticket not owned by your organization',
      );
    }
  }

  private async hasPendingRequest(
    ticketId: string,
    orgId: string,
  ): Promise<void> {
    const pendingRequest = await this.prisma.ticketRequests.findFirst({
      where: {
        ticketId: ticketId,
        orgId: orgId,
        status: TicketRequestStatus.PENDING,
      },
    });

    if (pendingRequest) {
      throw new BadRequestException(
        'A pending ticket request for this ticket already exists',
      );
    }
  }
}
