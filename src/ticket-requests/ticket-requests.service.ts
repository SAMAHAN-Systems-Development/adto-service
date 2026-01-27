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
import { Prisma, UserType } from '@prisma/client';

@Injectable()
export class TicketRequestsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTicketRequestDto: CreateTicketRequestDto, orgId: string) {
    try {
      const { ticketId } = createTicketRequestDto;
      await this.ticketOwnedByOrg(ticketId, orgId);
      await this.isTicketAlreadyRequested(ticketId, orgId);
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
      isApproved?: boolean;
      searchFilter?: string;
      organizationId?: string;
      ticketId?: string;
      orderBy?: 'asc' | 'desc';
    },
  ) {
    const {
      page = 1,
      limit = 10,
      isApproved,
      searchFilter,
      organizationId,
      ticketId,
      orderBy = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // 🔹 Same idea as your effectiveOrgId
    const effectiveOrgId =
      role === UserType.ORGANIZATION && orgId ? orgId : organizationId;

    const where: Prisma.TicketRequestsWhereInput = {
      ...(isApproved !== undefined && { isApproved }),
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
        ticket: true,
        org: true,
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
        select: {
          id: true,
          ticketId: true,
          orgId: true,
          isApproved: true,
          ticketLink: true,
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
      const { ticketLink } = approveTicketRequestDto;

      const approvedRequest = await this.prisma.ticketRequests.update({
        where: { id },
        data: {
          ticketLink: ticketLink || null,
          isApproved: !!ticketLink,
        },
      });

      return {
        message: ticketLink
          ? 'Ticket request approved successfully'
          : 'Ticket link removed, request marked as not approved',
        data: approvedRequest,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update ticket request',
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

  private async isTicketAlreadyRequested(
    ticketId: string,
    orgId: string,
  ): Promise<boolean> {
    const existingRequest = await this.prisma.ticketRequests.findFirst({
      where: {
        ticketId: ticketId,
        orgId: orgId,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'A ticket request for this ticket by your organization already exists',
      );
    }

    return !!existingRequest;
  }
}
