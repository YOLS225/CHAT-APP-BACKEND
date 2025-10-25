import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createRoomDto: CreateRoomDto) {
    try {
      const existingRoom = await this.prisma.room.findFirst({
        where: {
          OR: [
            { name: createRoomDto.name },
            { description: createRoomDto.description },
          ],
        },
      });
      if (existingRoom) {
        return failAction(
          null,
          false,
          'Room with this name or description already exists',
        );
      }
      const createdRoom = await this.prisma.room.create({
        data: {
          name: createRoomDto.name,
          description: createRoomDto.description,
          isDirectMessage: createRoomDto.isDirectMessage,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isDirectMessage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (createdRoom) {
        return successAction(createdRoom, true, 'Room:Created successfuly !');
      }
      return failAction(null, false, 'Error during room creation !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findAll(
    page: number,
    page_size: number,
    search?: string,
    isDirectMessage?: boolean,
  ) {
    try {
      const skip = (page - 1) * page_size;
      const where = {
        ...(search?.trim() && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(isDirectMessage !== undefined && {
          isDirectMessage: isDirectMessage,
        }),
      };

      const [content, total] = await Promise.all([
        this.prisma.room.findMany({
          skip,
          take: page_size,
          where,
          select: {
            id: true,
            name: true,
            description: true,
            isDirectMessage: true,
          },
          orderBy: { createdAt: 'asc' as const },
        }),
        this.prisma.room.count({ where }),
      ]);

      return successAction(
        { content, total, page, page_size },
        true,
        'Room: find successfully!',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findById(id: string) {
    try {
      const recoveredRoom = await this.prisma.room.findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isDirectMessage: true,
        },
      });

      if (!recoveredRoom) {
        return failAction(null, false, 'Room:not found !');
      }
      return successAction(recoveredRoom, true, 'Room:find successfuly !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async getRoomMembers(roomId: string) {
    try {
      const roomMembers = await this.prisma.roomMember.findMany({
        where: { roomId: roomId },
        select: {
          id: true,
          userId: true,
          roomId: true,
          joinedAt: true,
          role: true,
          isActive: true,
          user: {
            select: {
              id: true,
              userName: true,
            },
          },
        },
      });
      if (roomMembers) {
        return successAction(roomMembers, true, 'Room:find successfully!');
      } else {
        return failAction(null, false, 'Room:not found !');
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async getUserRooms(userId: string, isDirectMessage?: boolean) {
    try {
      const rooms = await this.prisma.roomMember.findMany({
        where: {
          userId: userId,
          ...(isDirectMessage !== undefined && {
            room: {
              isDirectMessage: isDirectMessage,
            },
          }),
        },
        select: {
          room: {
            select: {
              id: true,
              name: true,
              description: true,
              isDirectMessage: true,
              members: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      id: true,
                      userName: true,
                      avatar: true,
                      isOnline: true,
                    },
                  },
                },
              },
              messages: {
                select: {
                  content: true,
                  senderId: true,
                  sender: {
                    select: {
                      userName: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc' as const,
                },
                take: 1,
              },
            },
          },
        },
      });

      // Pour les DMs, remplacer le nom de la room par le nom de l'autre utilisateur
      const roomsWithDisplayName = rooms.map((roomMember) => {
        let displayName = roomMember.room.name;
        let otherUser: {
          id: string;
          userName: string;
          avatar: string | null;
          isOnline: boolean;
        } | null = null;

        if (roomMember.room.isDirectMessage) {
          // Trouver l'autre utilisateur (pas celui qui fait la requête)
          const otherMember = roomMember.room.members.find(
            (member) => member.userId !== userId,
          );
          if (otherMember) {
            displayName = otherMember.user.userName;
            otherUser = otherMember.user;
          }
        }

        // Construire le dernier message au format "username: message"
        let lastMessage: string | null = null;
        if (roomMember.room.messages.length > 0) {
          const lastMsg = roomMember.room.messages[0];
          const senderName =
            lastMsg.senderId === userId ? 'Vous' : lastMsg.sender.userName;
          lastMessage = `${senderName}: ${lastMsg.content}`;
        }

        return {
          id: roomMember.room.id,
          name: roomMember.room.name,
          displayName: displayName,
          description: roomMember.room.description,
          isDirectMessage: roomMember.room.isDirectMessage,
          otherUser: otherUser,
          lastMessage: lastMessage,
        };
      });

      if (roomsWithDisplayName) {
        return successAction(
          roomsWithDisplayName,
          true,
          'Room:find successfully!',
        );
      } else {
        return failAction(null, false, 'Room:not found !');
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    try {
      const recoveredRoom = await this.findById(id);
      if (!recoveredRoom) {
        return failAction(null, false, 'Room:not found !');
      }
      if (recoveredRoom) {
        const updatedRoom = await this.prisma.room.update({
          where: {
            id: id,
          },
          data: {
            name: updateRoomDto.name,
            description: updateRoomDto.description,
            updatedAt: new Date(),
          },
        });
        if (updatedRoom)
          return successAction(updatedRoom, true, 'Room:updated successfull!');
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  remove(id: string) {
    try {
      return `This action removes a #${id} room`;
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
