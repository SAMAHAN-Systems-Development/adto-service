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

  findAll() {
    return `This action returns all ticketRequests`;
  }

  findOne(id: string) {
    try {
      const ticketRequest = this.prisma.ticketRequests.findUnique({
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
