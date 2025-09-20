import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createMessageDto: CreateMessageDto) {
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
  }

  findAll() {
    return `This action returns all messages`;
  }

  async findAllMessages(roomId: string) {
    const messages = await this.prisma.message.findMany({
      where: { roomId: roomId },
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
          },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    });

    return successAction(messages, true, 'Messages found');
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  async update(id: string, updateMessageDto: UpdateMessageDto) {
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
        return successAction(newMessage, true, 'Message updated successfull !');
      } else {
        return failAction(null, false, 'Error during update message !');
      }
    }
  }

  async remove(id: string) {
    successAction(
      await this.prisma.message.delete({
        where: { id: id },
      }),
      true,
      'Message removed successfull !',
    );
  }
}
