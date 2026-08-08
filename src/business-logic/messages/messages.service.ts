import { Injectable } from '@nestjs/common';
import { AttachmentStatus, NotificationType } from '../../../generated/prisma';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async isActiveRoomMember(roomId: string, userId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      select: { isActive: true },
    });

    return Boolean(member?.isActive);
  }

  async create(createMessageDto: CreateMessageDto, senderId: string) {
    try {
      const [isMember, room] = await Promise.all([
        this.isActiveRoomMember(createMessageDto.roomId, senderId),
        this.prisma.room.findUnique({
          where: { id: createMessageDto.roomId },
          select: {
            id: true,
            name: true,
            workspaceId: true,
            isDirectMessage: true,
            members: {
              where: { isActive: true },
              select: {
                userId: true,
                user: { select: { userName: true } },
              },
            },
          },
        }),
      ]);
      if (!isMember) {
        return failAction(null, false, 'User is not a member of this room');
      }

      if (!room) {
        return failAction(null, false, 'Room not found');
      }

      const attachmentIds = createMessageDto.attachmentIds || [];
      if (!createMessageDto.content?.trim() && attachmentIds.length === 0) {
        return failAction(
          null,
          false,
          'Message content or attachment required',
        );
      }

      if (attachmentIds.length > 0) {
        const attachments = await this.prisma.attachment.findMany({
          where: {
            id: { in: attachmentIds },
            uploadedById: senderId,
            status: AttachmentStatus.PENDING,
          },
          select: { id: true },
        });

        if (attachments.length !== attachmentIds.length) {
          return failAction(
            null,
            false,
            'Some attachments are invalid or already attached',
          );
        }
      }

      const message = await this.prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
          data: {
            content: createMessageDto.content || '',
            roomId: createMessageDto.roomId,
            senderId,
            type: createMessageDto.type || 'TEXT',
          },
          include: {
            attachments: true,
            sender: {
              select: {
                id: true,
                userName: true,
                avatar: true,
              },
            },
          },
        });

        if (attachmentIds.length > 0) {
          await tx.attachment.updateMany({
            where: { id: { in: attachmentIds }, uploadedById: senderId },
            data: {
              messageId: created.id,
              status: AttachmentStatus.ATTACHED,
            },
          });

          return tx.message.findUnique({
            where: { id: created.id },
            include: {
              attachments: true,
              sender: {
                select: {
                  id: true,
                  userName: true,
                  avatar: true,
                },
              },
            },
          });
        }

        return created;
      });

      if (message) {
        if (room.isDirectMessage) {
          const sender = room.members.find(
            (member) => member.userId === senderId,
          );
          await Promise.all(
            room.members
              .filter((member) => member.userId !== senderId)
              .map((member) =>
                this.notificationsService.create({
                  recipientId: member.userId,
                  workspaceId: room.workspaceId,
                  type: NotificationType.DM_MESSAGE,
                  title: sender?.user.userName || 'Nouveau message',
                  body: createMessageDto.content || 'Nouveau message',
                  metadata: {
                    roomId: room.id,
                    messageId: message.id,
                    senderId,
                  },
                }),
              ),
          );
        }

        return successAction(message, true, 'Message:Created successfuly !');
      } else {
        return failAction(null, false, 'Error during message creation !');
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  findAll() {
    return `This action returns all messages`;
  }

  async findAllMessages(roomId: string, userId: string, search?: string) {
    try {
      const isMember = await this.isActiveRoomMember(roomId, userId);
      if (!isMember) {
        return failAction(null, false, 'User is not a member of this room');
      }

      const messages = await this.prisma.message.findMany({
        where: {
          roomId: roomId,
          isDeleted: false,
          ...(search?.trim() && {
            content: { contains: search.trim(), mode: 'insensitive' as const },
          }),
        },
        select: {
          id: true,
          content: true,
          // roomId: true,
          // senderId: true,
          isDeleted: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              userName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: 'asc' as const },
      });

      return successAction(messages, true, 'Messages found');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          roomId: true,
          senderId: true,
          isDeleted: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              userName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      if (!message || message.isDeleted) {
        return failAction(null, false, 'Message not found !');
      }

      const isMember = await this.isActiveRoomMember(message.roomId, userId);
      if (!isMember) {
        return failAction(null, false, 'User is not a member of this room');
      }

      return successAction(message, true, 'Message found');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async update(id: string, userId: string, updateMessageDto: UpdateMessageDto) {
    try {
      const recoveredMessage = await this.prisma.message.findFirst({
        where: { id: id },
      });
      if (!recoveredMessage || recoveredMessage.isDeleted) {
        return failAction(null, false, 'Message not found !');
      }

      if (recoveredMessage.senderId !== userId) {
        return failAction(null, false, 'Only the message author can edit it');
      }

      if (recoveredMessage) {
        const newMessage = await this.prisma.message.update({
          where: { id: id },
          data: {
            content: updateMessageDto.content,
            editedAt: new Date(),
          },
        });
        if (newMessage) {
          return successAction(
            newMessage,
            true,
            'Message updated successfull !',
          );
        } else {
          return failAction(null, false, 'Error during update message !');
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async remove(id: string, userId: string) {
    try {
      const recoveredMessage = await this.prisma.message.findFirst({
        where: { id: id },
      });
      if (!recoveredMessage || recoveredMessage.isDeleted) {
        return failAction(null, false, 'Message not found !');
      }

      if (recoveredMessage.senderId !== userId) {
        return failAction(null, false, 'Only the message author can delete it');
      }

      if (recoveredMessage) {
        const deletedMessage = await this.prisma.message.update({
          where: { id: id },
          data: { isDeleted: true },
        });

        if (deletedMessage) {
          return successAction(
            deletedMessage,
            true,
            'Message removed successfull !',
          );
        } else {
          return failAction(null, false, 'Error during delete message !');
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
