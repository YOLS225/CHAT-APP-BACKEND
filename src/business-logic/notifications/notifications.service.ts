import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

type CreateNotificationInput = {
  recipientId: string;
  workspaceId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        workspaceId: input.workspaceId || null,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata || Prisma.JsonNull,
      },
    });
  }

  async list(userId: string, workspaceId?: string, unreadOnly?: boolean) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          recipientId: userId,
          ...(workspaceId && { workspaceId }),
          ...(unreadOnly && { readAt: null }),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return successAction(notifications, true, 'Notifications found');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async unreadCount(userId: string, workspaceId?: string) {
    try {
      const count = await this.prisma.notification.count({
        where: {
          recipientId: userId,
          readAt: null,
          ...(workspaceId && { workspaceId }),
        },
      });

      return successAction({ count }, true, 'Unread notifications count');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async markRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id: notificationId, recipientId: userId },
      });

      if (!notification) {
        return failAction(null, false, 'Notification not found');
      }

      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: notification.readAt || new Date() },
      });

      return successAction(updated, true, 'Notification marked as read');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async markAllRead(userId: string, workspaceId?: string) {
    try {
      await this.prisma.notification.updateMany({
        where: {
          recipientId: userId,
          readAt: null,
          ...(workspaceId && { workspaceId }),
        },
        data: { readAt: new Date() },
      });

      return successAction(null, true, 'Notifications marked as read');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
