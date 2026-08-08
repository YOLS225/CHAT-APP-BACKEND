import { Test, TestingModule } from '@nestjs/testing';
import { RoomMembersController } from './room-members.controller';
import { RoomMembersService } from '../../business-logic/room-members/room-members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../business-logic/notifications/notifications.service';

describe('RoomMembersController', () => {
  let controller: RoomMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomMembersController],
      providers: [RoomMembersService, PrismaService, NotificationsService],
    }).compile();

    controller = module.get<RoomMembersController>(RoomMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
