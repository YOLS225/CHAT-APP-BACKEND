import { Injectable } from '@nestjs/common';
import { CreateRoomMemberDto } from './dto/create-room-member.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { UpdateMemberRoleDto } from './dto/update-room-member.dto';
import { NotificationType, RoomRole } from '../../../generated/prisma';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoomMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private canManageMembers(role?: RoomRole) {
    return role === RoomRole.OWNER || role === RoomRole.ADMIN;
  }

  private async findActiveMember(userId: string, roomId: string) {
    return this.prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      select: {
        id: true,
        userId: true,
        roomId: true,
        role: true,
        isActive: true,
      },
    });
  }

  async joinRoom(createRoomMemberDto: CreateRoomMemberDto, userId: string) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: createRoomMemberDto.roomId },
        select: { workspaceId: true, isPrivate: true, isDirectMessage: true },
      });

      if (!room) {
        return failAction(null, false, 'Room:not found !');
      }

      if (room.isDirectMessage) {
        return failAction(null, false, 'Direct messages cannot be joined');
      }

      if (room.isPrivate) {
        return failAction(
          null,
          false,
          'Private rooms require an owner/admin invitation',
        );
      }

      const workspaceMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: room.workspaceId,
            userId,
          },
        },
        select: { status: true },
      });

      if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      // Vérifier si cet utilisateur est déjà dans cette room spécifique
      const existingMember = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId,
            roomId: createRoomMemberDto.roomId,
          },
        },
      });

      if (existingMember) {
        if (!existingMember.isActive) {
          const reactivated = await this.prisma.roomMember.update({
            where: { id: existingMember.id },
            data: { isActive: true },
            select: {
              id: true,
              userId: true,
              roomId: true,
              joinedAt: true,
            },
          });
          return successAction(
            reactivated,
            true,
            'Room membership reactivated !',
          );
        }

        return failAction(null, false, 'User is already a member of this room');
      }

      const newMember = await this.prisma.roomMember.create({
        data: {
          userId,
          roomId: createRoomMemberDto.roomId,
          role: RoomRole.MEMBER,
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

  async addMember(roomId: string, actorUserId: string, dto: AddRoomMemberDto) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          id: true,
          workspaceId: true,
          isDirectMessage: true,
          isActive: true,
        },
      });
      if (!room || !room.isActive) {
        return failAction(null, false, 'Room:not found !');
      }

      if (room.isDirectMessage) {
        return failAction(null, false, 'Direct message members are locked');
      }

      const actor = await this.findActiveMember(actorUserId, roomId);
      if (!actor?.isActive || !this.canManageMembers(actor.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

      const workspaceMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: room.workspaceId,
            userId: dto.userId,
          },
        },
        select: { status: true },
      });

      if (!workspaceMember || workspaceMember.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'Target user is not active in this workspace',
        );
      }

      const existingMember = await this.prisma.roomMember.findUnique({
        where: {
          userId_roomId: {
            userId: dto.userId,
            roomId,
          },
        },
      });

      if (existingMember) {
        const updated = await this.prisma.roomMember.update({
          where: { id: existingMember.id },
          data: {
            isActive: true,
            role: dto.role || existingMember.role,
          },
          select: {
            id: true,
            userId: true,
            roomId: true,
            role: true,
            isActive: true,
            joinedAt: true,
          },
        });
        await this.notificationsService.create({
          recipientId: dto.userId,
          workspaceId: room.workspaceId,
          type: NotificationType.ROOM_MEMBER_ADDED,
          title: 'Ajout à une room',
          body: 'Vous avez été ajouté à une room.',
          metadata: { roomId },
        });
        return successAction(updated, true, 'Room member updated');
      }

      const created = await this.prisma.roomMember.create({
        data: {
          userId: dto.userId,
          roomId,
          role: dto.role || RoomRole.MEMBER,
        },
        select: {
          id: true,
          userId: true,
          roomId: true,
          role: true,
          isActive: true,
          joinedAt: true,
        },
      });

      await this.notificationsService.create({
        recipientId: dto.userId,
        workspaceId: room.workspaceId,
        type: NotificationType.ROOM_MEMBER_ADDED,
        title: 'Ajout à une room',
        body: 'Vous avez été ajouté à une room.',
        metadata: { roomId },
      });

      return successAction(created, true, 'Room member added');
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

  async updateMemberRole(
    memberId: string,
    actorUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    try {
      const target = await this.prisma.roomMember.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          userId: true,
          roomId: true,
          role: true,
          room: { select: { isDirectMessage: true } },
        },
      });
      if (!target) return failAction(null, false, 'Membre introuvable');

      if (target.room.isDirectMessage) {
        return failAction(null, false, 'Direct message members are locked');
      }

      const actor = await this.findActiveMember(actorUserId, target.roomId);
      if (!actor?.isActive || !this.canManageMembers(actor.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

      if (target.role === RoomRole.OWNER && actor.role !== RoomRole.OWNER) {
        return failAction(
          null,
          false,
          'Only an owner can update another owner',
        );
      }

      if (dto.role === RoomRole.OWNER && actor.role !== RoomRole.OWNER) {
        return failAction(null, false, 'Only an owner can assign owner role');
      }

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

  async kickMember(memberId: string, actorUserId: string) {
    try {
      const target = await this.prisma.roomMember.findFirst({
        where: { id: memberId },
        include: {
          room: { select: { isDirectMessage: true, workspaceId: true } },
        },
      });
      if (!target) return failAction(null, false, 'Membre introuvable');

      if (target.room.isDirectMessage) {
        return failAction(null, false, 'Direct message members are locked');
      }

      const actor = await this.findActiveMember(actorUserId, target.roomId);
      if (!actor?.isActive || !this.canManageMembers(actor.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

      if (target.role === RoomRole.OWNER && actor.role !== RoomRole.OWNER) {
        return failAction(null, false, 'Only an owner can kick another owner');
      }

      await this.prisma.roomMember.delete({ where: { id: memberId } });
      await this.notificationsService.create({
        recipientId: target.userId,
        workspaceId: target.room.workspaceId,
        type: NotificationType.ROOM_MEMBER_REMOVED,
        title: 'Retrait d’une room',
        body: 'Vous avez été retiré d’une room.',
        metadata: { roomId: target.roomId },
      });
      return successAction(null, true, 'Membre exclu avec succès');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async leaveRoom(id: string, userId: string) {
    try {
      const recoveredMember = await this.findById(id);
      if (recoveredMember.success && recoveredMember.data?.userId !== userId) {
        return failAction(
          null,
          false,
          'You can only leave your own membership',
        );
      }

      if (recoveredMember.success && recoveredMember.data) {
        const room = await this.prisma.room.findUnique({
          where: { id: recoveredMember.data.roomId },
          select: { isDirectMessage: true },
        });
        if (room?.isDirectMessage) {
          return failAction(null, false, 'Direct messages cannot be left');
        }

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

  async removeMember(id: string, actorUserId: string) {
    try {
      const recoveredMember = await this.findById(id);
      if (!recoveredMember.success || !recoveredMember.data) {
        return failAction(null, false, 'Member:not found !');
      }

      const room = await this.prisma.room.findUnique({
        where: { id: recoveredMember.data.roomId },
        select: { isDirectMessage: true, workspaceId: true },
      });
      if (room?.isDirectMessage) {
        return failAction(null, false, 'Direct message members are locked');
      }

      const actor = await this.findActiveMember(
        actorUserId,
        recoveredMember.data.roomId,
      );
      if (!actor?.isActive || !this.canManageMembers(actor.role)) {
        return failAction(null, false, 'Insufficient permissions');
      }

      if (
        recoveredMember.data.role === RoomRole.OWNER &&
        actor.role !== RoomRole.OWNER
      ) {
        return failAction(
          null,
          false,
          'Only an owner can remove another owner',
        );
      }

      if (recoveredMember.success) {
        const memberUpdated = await this.prisma.roomMember.delete({
          where: { id: id },
        });
        if (memberUpdated) {
          await this.notificationsService.create({
            recipientId: recoveredMember.data.userId,
            workspaceId: room?.workspaceId,
            type: NotificationType.ROOM_MEMBER_REMOVED,
            title: 'Retrait d’une room',
            body: 'Vous avez été retiré d’une room.',
            metadata: { roomId: recoveredMember.data.roomId },
          });
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
