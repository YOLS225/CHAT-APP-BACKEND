import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from '../../rest/rooms/rooms.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService],
})
export class RoomsModule {}
