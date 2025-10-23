import { Injectable } from '@nestjs/common';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
// import { UpdateRoomMemberDto } from './dto/update-room-member.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class RoomMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async joinRoom(createRoomMemberDto: CreateRoomMemberDto) {
    try {
      const existingMember = await this.prisma.roomMember.findFirst({
        where: { userId: createRoomMemberDto.userId },
      });
      if (existingMember) {
        return failAction(null, false, 'Room member already exists');
      }

      const newMember = await this.prisma.roomMember.create({
        data: {
          userId: createRoomMemberDto.userId,
          roomId: createRoomMemberDto.roomId,
        },
        select: {
          id: true,
          userId: true,
          roomId: true,
          joinedAt: true,
        },
      });
      if (newMember) {
        return successAction(newMember, true, 'Room:Created successfuly !');
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findAll(page: number, page_size: number) {
    try {
      const skip = (page - 1) * page_size;
      const where = {};

      const [content, total] = await Promise.all([
        this.prisma.roomMember.findMany({
          skip,
          take: page_size,
          where,
          orderBy: { joinedAt: 'asc' as const },
        }),
        this.prisma.roomMember.count({ where }),
      ]);
      return successAction(
        { content, total, page, page_size },
        true,
        'Members: find successfully!',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findById(id: string) {
    try {
      const recoveredMember = await this.prisma.roomMember.findFirst({
        where: { id: id },
      });
      if (!recoveredMember) {
        return failAction(null, false, 'Member:not found !');
      }
      return successAction(recoveredMember, true, 'Member: find successfully!');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  // update(id: string, updateRoomMemberDto: UpdateRoomMemberDto) {
  //   return `This action updates a #${id} roomMember`;
  // }

  async leaveRoom(id: string) {
    try {
      const recoveredMember = await this.findById(id);
      if (recoveredMember) {
        const memberUpdated = await this.prisma.roomMember.update({
          where: { id: id },
          data: {
            isActive: false,
          },
        });
        if (memberUpdated) {
          return successAction(
            memberUpdated,
            true,
            'Member:leaved successfuly !',
          );
        } else {
          return failAction(null, false, 'Error during the action !');
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async removeMember(id: string) {
    try {
      const recoveredMember = await this.findById(id);
      if (recoveredMember) {
        const memberUpdated = await this.prisma.roomMember.delete({
          where: { id: id },
        });
        if (memberUpdated) {
          return successAction(memberUpdated, true);
        } else {
          return failAction(null, false, 'Member:not found !');
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
