import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from '../../rest/messages/messages.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, PrismaService],
})
export class MessagesModule {}
