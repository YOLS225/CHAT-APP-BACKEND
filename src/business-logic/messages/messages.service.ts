import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

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
      const isMember = await this.isActiveRoomMember(
        createMessageDto.roomId,
        senderId,
      );
      if (!isMember) {
        return failAction(null, false, 'User is not a member of this room');
      }

      const message = await this.prisma.message.create({
        data: {
          content: createMessageDto.content,
          roomId: createMessageDto.roomId,
          senderId,
          type: createMessageDto.type || 'TEXT',
        },
      });
      if (message) {
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
              userName: true,
              avatar: true,
            },
          },
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
              userName: true,
              avatar: true,
            },
          },
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
