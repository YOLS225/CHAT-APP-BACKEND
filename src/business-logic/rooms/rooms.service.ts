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

  async findAll(page: number, page_size: number, search?: string) {
    try {
      const skip = (page - 1) * page_size;
      const where = {
        ...(search?.trim() && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
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

  async getPublicRooms(page: number, page_size: number, search?: string) {
    try {
      const skip = (page - 1) * page_size;
      const where = {
        isDirectMessage: false,
        ...(search?.trim() && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
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

  async getDirectMessageRooms(
    page: number,
    page_size: number,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * page_size;
      const where = {
        isDirectMessage: true,
        ...(search?.trim() && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
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

  async getUserRooms(userId: string) {
    try {
      const rooms = await this.prisma.roomMember.findMany({
        where: { userId: userId },
        select: {
          id: true,
          roomId: true,
          room: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
      if (rooms) {
        return successAction(rooms, true, 'Room:find successfully!');
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
