import { Injectable } from '@nestjs/common';
import { CreateTicketRequestDto } from './dto/ticket-request.dto';
import { UpdateTicketRequestDto } from './dto/update-ticket-request.dto';

@Injectable()
export class TicketRequestsService {
  create(createTicketRequestDto: CreateTicketRequestDto) {
    return 'This action adds a new ticketRequest';
  }

  findAll() {
    return `This action returns all ticketRequests`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketRequest`;
  }

  update(id: number, updateTicketRequestDto: UpdateTicketRequestDto) {
    return `This action updates a #${id} ticketRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketRequest`;
  }
}
