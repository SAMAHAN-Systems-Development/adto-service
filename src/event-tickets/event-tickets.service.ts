import { Injectable } from '@nestjs/common';
import { CreateEventTicketDto } from './dto/create-event-ticket.dto';
import { UpdateEventTicketDto } from './dto/update-event-ticket.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventTicketsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(createEventTicketDto: CreateEventTicketDto) {
    return 'This action adds a new eventTicket';
  }

  findAll() {
    return `This action returns all eventTickets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} eventTicket`;
  }

  update(id: number, updateEventTicketDto: UpdateEventTicketDto) {
    return `This action updates a #${id} eventTicket`;
  }

  remove(id: number) {
    return `This action removes a #${id} eventTicket`;
  }
}
