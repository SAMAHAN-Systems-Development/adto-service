import { Test, TestingModule } from '@nestjs/testing';
import { EventAnnouncementsController } from './event-announcements.controller';
import { EventAnnouncementsService } from './event-announcements.service';

describe('EventAnnouncementsController', () => {
  let controller: EventAnnouncementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAnnouncementsController],
      providers: [EventAnnouncementsService],
    }).compile();

    controller = module.get<EventAnnouncementsController>(
      EventAnnouncementsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
