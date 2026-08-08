import { Module } from '@nestjs/common';
import { RoomMembersService } from './room-members.service';
import { RoomMembersController } from '../../rest/room-members/room-members.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RoomMembersController],
  providers: [RoomMembersService, PrismaService],
})
export class RoomMembersModule {}
