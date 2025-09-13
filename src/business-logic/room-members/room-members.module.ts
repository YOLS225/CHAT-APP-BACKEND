import { Module } from '@nestjs/common';
import { RoomMembersService } from './room-members.service';
import { RoomMembersController } from '../../rest/room-members/room-members.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [RoomMembersController],
  providers: [RoomMembersService, PrismaService],
})
export class RoomMembersModule {}
