import { Injectable } from '@nestjs/common';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { UpdateMemberRoleDto } from './dto/update-room-member.dto';
import { RoomRole } from '../../utils/types';

@Injectable()
export class RoomMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async joinRoom(createRoomMemberDto: CreateRoomMemberDto) {
    try {
      // Vérifier si cet utilisateur est déjà dans cette room spécifique
      const existingMember = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: createRoomMemberDto.userId,
            roomId: createRoomMemberDto.roomId,
          },
        },
      });

      if (existingMember) {
        return failAction(null, false, 'User is already a member of this room');
      }

      const newMember = await this.prisma.roomMember.create({
        data: {
          userId: createRoomMemberDto.userId,
          roomId: createRoomMemberDto.roomId,
          role: createRoomMemberDto.role as RoomRole,
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

  async updateMemberRole(memberId: string, dto: UpdateMemberRoleDto) {
    try {
      const updated = await this.prisma.roomMember.update({
        where: { id: memberId },
        data: { role: dto.role },
        select: { id: true, userId: true, roomId: true, role: true },
      });
      return successAction(updated, true, 'Rôle mis à jour avec succès');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async kickMember(memberId: string) {
    try {
      const target = await this.prisma.roomMember.findFirst({
        where: { id: memberId },
      });
      if (!target) return failAction(null, false, 'Membre introuvable');

      await this.prisma.roomMember.delete({ where: { id: memberId } });
      return successAction(null, true, 'Membre exclu avec succès');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

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
