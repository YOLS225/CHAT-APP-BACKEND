import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatRoomForUser(
    room: {
      id: string;
      name: string;
      description: string | null;
      isPrivate?: boolean;
      isDirectMessage: boolean;
      createdAt?: Date;
      members: Array<{
        userId: string;
        user: {
          id: string;
          userName: string;
          avatar: string | null;
          isOnline: boolean;
        };
      }>;
      messages?: Array<{
        content: string;
        senderId: string;
        sender: {
          userName: string;
        };
      }>;
    },
    userId: string,
  ) {
    let displayName = room.name;
    let otherUser: {
      id: string;
      userName: string;
      avatar: string | null;
      isOnline: boolean;
    } | null = null;

    if (room.isDirectMessage) {
      const otherMember = room.members.find(
        (member) => member.userId !== userId,
      );
      if (otherMember) {
        displayName = otherMember.user.userName;
        otherUser = otherMember.user;
      }
    }

    let lastMessage: string | null = null;
    const lastMsg = room.messages?.[0];
    if (lastMsg) {
      const senderName =
        lastMsg.senderId === userId ? 'Vous' : lastMsg.sender.userName;
      lastMessage = `${senderName}: ${lastMsg.content}`;
    }

    return {
      id: room.id,
      name: room.name,
      displayName,
      description: room.description,
      isPrivate: room.isPrivate,
      isDirectMessage: room.isDirectMessage,
      createdAt: room.createdAt,
      otherUser,
      lastMessage,
    };
  }

  private canManageRoom(role?: string) {
    return role === 'OWNER' || role === 'ADMIN';
  }

  private async findActiveMember(roomId: string, userId: string) {
    return this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      select: { role: true, isActive: true },
    });
  }

  private async findActiveWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { role: true, status: true },
    });
  }

  async create(createRoomDto: CreateRoomDto, ownerId: string) {
    try {
      const workspaceMember = await this.findActiveWorkspaceMember(
        createRoomDto.workspaceId,
        ownerId,
      );
      if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      // const existingRoom = await this.prisma.room.findFirst({
      //   where: {
      //     OR: [
      //       { name: createRoomDto.name },
      //       { description: createRoomDto.description },
      //     ],
      //   },
      // });
      // if (existingRoom) {
      //   return failAction(
      //     null,
      //     false,
      //     'Room with this name or description already exists',
      //   );
      // }
      const createdRoom = await this.prisma.$transaction(async (tx) => {
        const room = await tx.room.create({
          data: {
            name: createRoomDto.name,
            description: createRoomDto.description,
            isPrivate: createRoomDto.isPrivate,
            isDirectMessage: createRoomDto.isDirectMessage,
            workspaceId: createRoomDto.workspaceId,
          },
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
            isDirectMessage: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.roomMember.create({
          data: {
            roomId: room.id,
            userId: ownerId,
            role: 'OWNER',
          },
        });

        return room;
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
    userId: string,
    workspaceId?: string,
    search?: string,
    isDirectMessage?: boolean,
  ) {
    try {
      if (!workspaceId) {
        return failAction(null, false, 'workspaceId is required');
      }

      const workspaceMember = await this.findActiveWorkspaceMember(
        workspaceId,
        userId,
      );
      if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      const skip = (page - 1) * page_size;

      const rooms = await this.prisma.room.findMany({
        skip,
        take: page_size,
        where: {
          workspaceId,
          isActive: true,
          ...(isDirectMessage !== undefined && {
            isDirectMessage,
          }),
          OR: [
            {
              isPrivate: false,
              isDirectMessage: false,
            },
            {
              members: {
                some: {
                  userId,
                  isActive: true,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPrivate: true,
          isDirectMessage: true,
          createdAt: true,
          members: {
            where: { isActive: true },
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
            where: { isDeleted: false },
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
        orderBy: { createdAt: 'asc' as const },
      });

      let content = rooms.map((room) => this.formatRoomForUser(room, userId));

      if (search?.trim()) {
        const searchLower = search.toLowerCase();
        content = content.filter((room) =>
          room.isDirectMessage
            ? room.displayName.toLowerCase().includes(searchLower)
            : room.name.toLowerCase().includes(searchLower),
        );
      }

      return successAction(content, true, 'Room: find successfully!');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findById(id: string, userId?: string) {
    try {
      const recoveredRoom = await this.prisma.room.findFirst({
        where: {
          id: id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPrivate: true,
          isDirectMessage: true,
          workspaceId: true,
          createdAt: true,
          members: {
            where: { isActive: true },
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
        },
      });

      if (!recoveredRoom) {
        return failAction(null, false, 'Room:not found !');
      }

      if (userId) {
        const workspaceMember = await this.findActiveWorkspaceMember(
          recoveredRoom.workspaceId,
          userId,
        );
        if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
          return failAction(
            null,
            false,
            'User is not a member of this workspace',
          );
        }

        if (recoveredRoom.isPrivate || recoveredRoom.isDirectMessage) {
          const member = await this.findActiveMember(id, userId);
          if (!member?.isActive) {
            return failAction(null, false, 'User is not a member of this room');
          }
        }
      }

      return successAction(
        userId ? this.formatRoomForUser(recoveredRoom, userId) : recoveredRoom,
        true,
        'Room:find successfuly !',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async getRoomMembers(roomId: string, userId: string) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          workspaceId: true,
          isPrivate: true,
          isDirectMessage: true,
          isActive: true,
        },
      });
      if (!room || !room.isActive) {
        return failAction(null, false, 'Room:not found !');
      }

      const workspaceMember = await this.findActiveWorkspaceMember(
        room.workspaceId,
        userId,
      );
      if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      if (room.isPrivate || room.isDirectMessage) {
        const member = await this.findActiveMember(roomId, userId);
        if (!member?.isActive) {
          return failAction(null, false, 'User is not a member of this room');
        }
      }

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
              avatar: true,
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

  async getUserRooms(
    userId: string,
    workspaceId?: string,
    isDirectMessage?: boolean,
    search?: string,
  ) {
    return this.findAll(
      1,
      100000,
      userId,
      workspaceId,
      search,
      isDirectMessage,
    );
  }

  async update(id: string, userId: string, updateRoomDto: UpdateRoomDto) {
    try {
      const member = await this.findActiveMember(id, userId);
      if (!member?.isActive || !this.canManageRoom(member.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

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
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async remove(id: string, userId: string) {
    try {
      const member = await this.findActiveMember(id, userId);
      if (!member?.isActive || !this.canManageRoom(member.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

      const deletedRoom = await this.prisma.room.delete({
        where: {
          id: id,
        },
      });

      if (deletedRoom)
        return successAction(deletedRoom, true, 'Room:deleted successfull!');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
