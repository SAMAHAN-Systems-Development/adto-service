import { Test, TestingModule } from '@nestjs/testing';
import { EventAnnouncementsService } from './event-announcements.service';

describe('EventAnnouncementsService', () => {
  let service: EventAnnouncementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventAnnouncementsService],
    }).compile();

    service = module.get<EventAnnouncementsService>(EventAnnouncementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
