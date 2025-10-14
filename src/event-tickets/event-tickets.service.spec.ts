import { Test, TestingModule } from '@nestjs/testing';
import { EventTicketsService } from './event-tickets.service';

describe('EventTicketsService', () => {
  let service: EventTicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventTicketsService],
    }).compile();

    service = module.get<EventTicketsService>(EventTicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
