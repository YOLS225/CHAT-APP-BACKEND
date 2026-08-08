import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../business-logic/notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [NotificationsService, PrismaService],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
