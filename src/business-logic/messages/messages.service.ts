import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    try {
      const message = await this.prisma.message.create({
        data: {
          content: createMessageDto.content,
          roomId: createMessageDto.roomId,
          senderId: createMessageDto.senderId,
          isDeleted: createMessageDto.isDeleted,
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

  async findAllMessages(roomId: string, search?: string) {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          roomId: roomId,
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

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
    try {
      const recoveredMessage = await this.prisma.message.findFirst({
        where: { id: id },
      });
      if (recoveredMessage) {
        const newMessage = await this.prisma.message.update({
          where: { id: id },
          data: {
            content: updateMessageDto.content,
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

  async remove(id: string) {
    try {
      const recoveredMessage = await this.prisma.message.findFirst({
        where: { id: id },
      });
      if (!recoveredMessage) {
        return failAction(null, false, 'Message not found !');
      }

      if (recoveredMessage) {
        const deletedMessage = await this.prisma.message.delete({
          where: { id: id },
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
