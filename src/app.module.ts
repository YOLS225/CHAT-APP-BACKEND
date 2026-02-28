import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './business-logic/users/users.module';
import { MessagesModule } from './business-logic/messages/messages.module';
import { RoomsModule } from './business-logic/rooms/rooms.module';
import { RoomMembersModule } from './business-logic/room-members/room-members.module';
import { AuthModule } from './business-logic/auth/auth.module';
import { StatisticsModule } from './business-logic/statistics/statistics.module';
import { StorageModule } from './business-logic/storage/storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    MessagesModule,
    RoomsModule,
    RoomMembersModule,
    AuthModule,
    StatisticsModule,
    StorageModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
