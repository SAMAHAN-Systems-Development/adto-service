import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventTicketDto } from './dto/create-event-ticket.dto';
import { UpdateEventTicketDto } from './dto/update-event-ticket.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventTicketsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private ensureFutureDate(date: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
      throw new HttpException(
        'registrationDeadline must be a valid future date',
        HttpStatus.BAD_REQUEST,
      );
    }

    return parsed;
  }

  private ensureOrgId(orgId?: string) {
    if (!orgId) {
      throw new HttpException(
        'Forbidden: missing organization context',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async assertEventInOrg(eventId: string, orgId: string) {
    this.ensureOrgId(orgId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, orgId: true },
    });

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    if (event.orgId !== orgId) {
      throw new HttpException(
        'Forbidden: event does not belong to your organization',
        HttpStatus.FORBIDDEN,
      );
    }

    return event;
  }

  async create(createEventTicketDto: CreateEventTicketDto, orgId: string) {
    this.ensureOrgId(orgId);
    const { eventId, registrationDeadline, ...ticketData } = createEventTicketDto;

    await this.assertEventInOrg(eventId, orgId);
    const deadline = this.ensureFutureDate(registrationDeadline);

    const ticket = await this.prisma.ticketCategory.create({
      data: {
        ...ticketData,
        registrationDeadline: deadline,
        event: {
          connect: { id: eventId },
        },
      },
    });

    return {
      message: 'Event ticket created successfully',
      data: ticket,
    };
  }

  async findAll(orgId: string, query: { page?: number; limit?: number; eventId?: string }) {
    this.ensureOrgId(orgId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    let where: Prisma.TicketCategoryWhereInput = {
      event: {
        orgId,
      },
    };

    if (query.eventId) {
      await this.assertEventInOrg(query.eventId, orgId);
      where = {
        ...where,
        eventId: query.eventId,
      };
    }

    const [tickets, totalCount] = await Promise.all([
      this.prisma.ticketCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticketRequests: {
            where: {
              isApproved: true,
            },
            select: {
              ticketLink: true,
            },
          },
        },
      }),
      this.prisma.ticketCategory.count({ where }),
    ]);

    const data = tickets.map(({ ticketRequests, ...ticket }) => ({
      ...ticket,
      ticketLinks: ticket.price > 0 ? ticketRequests.map((req) => req.ticketLink) : [],
    }));

    return {
      data,
      meta: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async findAllPublic(query: { eventId?: string }) {
    const [tickets] = await Promise.all([
      this.prisma.ticketCategory.findMany({
        where: query.eventId
          ? {
              eventId: query.eventId,
            }
          : {},
        orderBy: { createdAt: 'desc' },
        include: {
          ticketRequests: {
            where: {
              isApproved: true,
            },
            select: {
              ticketLink: true,
            },
          },
        },
      }),
    ]);

    const data = tickets.map(({ ticketRequests, ...ticket }) => ({
      ...ticket,
      ticketLinks: ticket.price > 0 ? ticketRequests.map((req) => req.ticketLink) : [],
    }));

    return {
      data,
    };
  }

  async findOne(id: string, orgId: string) {
    this.ensureOrgId(orgId);
    const ticket = await this.prisma.ticketCategory.findUnique({
      where: { id },
      include: {
        event: true,
        ticketRequests: {
          where: {
            isApproved: true,
          },
          select: {
            ticketLink: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new HttpException('Ticket not found', HttpStatus.NOT_FOUND);
    }

    if (ticket.event.orgId !== orgId) {
      throw new HttpException(
        'Forbidden: ticket does not belong to your organization',
        HttpStatus.FORBIDDEN,
      );
    }

    const formattedTicket = {
      ...ticket,
      ticketRequests: undefined,
      ticketLinks: ticket.price > 0 ? ticket.ticketRequests.map((req) => req.ticketLink) : [],
    };

    return formattedTicket;
  }

  async update(id: string, updateEventTicketDto: UpdateEventTicketDto, orgId: string) {
    this.ensureOrgId(orgId);
    const existingTicket = await this.findOne(id, orgId);
    const { eventId, registrationDeadline, ...ticketData } = updateEventTicketDto;

    let deadline: Date | undefined;
    if (registrationDeadline) {
      deadline = this.ensureFutureDate(registrationDeadline);
    }

    if (eventId) {
      await this.assertEventInOrg(eventId, orgId);
    }

    const data: Prisma.TicketCategoryUpdateInput = {
      ...(ticketData.name !== undefined && { name: ticketData.name }),
      ...(ticketData.description !== undefined && { description: ticketData.description }),
      ...(ticketData.price !== undefined && { price: ticketData.price }),
      ...(ticketData.capacity !== undefined && { capacity: ticketData.capacity }),
      ...(deadline && { registrationDeadline: deadline }),
      ...(eventId && {
        event: {
          connect: { id: eventId },
        },
      }),
    };

    const updatedTicket = await this.prisma.ticketCategory.update({
      where: { id: existingTicket.id },
      data,
    });

    return {
      message: 'Event ticket updated successfully',
      data: updatedTicket,
    };
  }

  async remove(id: string, orgId: string) {
    this.ensureOrgId(orgId);
    const ticket = await this.findOne(id, orgId);

    await this.prisma.ticketCategory.delete({
      where: { id: ticket.id },
    });

    return {
      message: 'Event ticket deleted successfully',
    };
  }
}
