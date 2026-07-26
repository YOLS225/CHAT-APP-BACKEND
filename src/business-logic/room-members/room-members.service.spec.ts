import { Test, TestingModule } from '@nestjs/testing';
import { RoomMembersService } from './room-members.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RoomMembersService', () => {
  let service: RoomMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomMembersService, PrismaService],
    }).compile();

    service = module.get<RoomMembersService>(RoomMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
