import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { UserStatus } from '../../utils/types';
import { hash, compare } from 'bcrypt';
import { UpdateUserDto, UpdatePasswordDto } from './dto/update-user.dto';
import { PlatformRole } from '../../../generated/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolvePlatformRole(email: string) {
    const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.includes(email.toLowerCase())) {
      return PlatformRole.SUPER_ADMIN;
    }

    const usersCount = await this.prisma.user.count();
    return usersCount === 0 ? PlatformRole.SUPER_ADMIN : PlatformRole.USER;
  }

  async save(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: createUserDto.email },
            { userName: createUserDto.userName },
          ],
        },
      });

      if (existingUser) {
        return failAction(
          null,
          false,
          'User with this email or username already exists',
        );
      }

      // Hash du mot de passe
      const hashedPassword = await hash(createUserDto.password, 10);
      const platformRole = await this.resolvePlatformRole(createUserDto.email);

      const createdUser = await this.prisma.user.create({
        data: {
          userName: createUserDto.userName,
          email: createUserDto.email,
          password: hashedPassword,
          avatar: createUserDto.avatar,
          isOnline: false,
          platformRole,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          avatar: true,
          isOnline: true,
          status: true,
          platformRole: true,
        },
      });

      if (createdUser) {
        return successAction(createdUser, true, 'User:Created successfuly !');
      }
      return failAction(null, false, 'Error during user creation !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findAll(
    page: number,
    page_size: number,
    actorUserId: string,
    workspaceId?: string,
    search?: string,
  ) {
    try {
      if (!workspaceId) {
        return failAction(null, false, 'workspaceId is required');
      }

      const actor = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: actorUserId,
          },
        },
        select: { status: true },
      });

      if (!actor || actor.status !== 'ACTIVE') {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      const skip = (page - 1) * page_size;

      const where = {
        workspaceId,
        status: { not: 'DISABLED' as const },
        user: {
          status: { not: UserStatus.INACTIVE },
          ...(search?.trim() && {
            OR: [
              { userName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }),
        },
      };

      const [content, total] = await Promise.all([
        this.prisma.workspaceMember.findMany({
          skip,
          take: page_size,
          where,
          select: {
            role: true,
            status: true,
            user: {
              select: {
                id: true,
                userName: true,
                email: true,
                avatar: true,
                isOnline: true,
                createdAt: true,
                updatedAt: true,
                lastSeen: true,
                status: true,
                platformRole: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' as const },
        }),
        this.prisma.workspaceMember.count({ where }),
      ]);

      return successAction(
        { content, total, page, page_size },
        true,
        'User: find successfully!',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findAllPlatform(page: number, page_size: number, search?: string) {
    try {
      const skip = (page - 1) * page_size;

      const where = {
        status: { not: UserStatus.INACTIVE },
        ...(search?.trim() && {
          OR: [
            { userName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [content, total] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: page_size,
          where,
          select: {
            id: true,
            userName: true,
            email: true,
            avatar: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
            lastSeen: true,
            status: true,
            platformRole: true,
          },
          orderBy: { createdAt: 'asc' as const },
        }),
        this.prisma.user.count({ where }),
      ]);

      return successAction(
        { content, total, page, page_size },
        true,
        'User: find successfully!',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findById(id: string) {
    try {
      const recoveredUser = await this.prisma.user.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          avatar: true,
          isOnline: true,
          createdAt: true,
          updatedAt: true,
          lastSeen: true,
          status: true,
          platformRole: true,
        },
      });
      if (!recoveredUser) {
        return failAction(null, false, 'User:not found !');
      }
      return successAction(recoveredUser, true, 'User:find successfuly !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      const recoveredUser = await this.findById(id);
      if (!recoveredUser.success) {
        return failAction(null, false, 'User:not found !');
      }
      const userUpdated = await this.prisma.user.update({
        where: { id },
        data: {
          userName: updateUserDto.userName,
          email: updateUserDto.email,
          avatar: updateUserDto.avatar,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          avatar: true,
          isOnline: true,
          status: true,
        },
      });
      return successAction(userUpdated, true, 'User:updated successfuly !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, password: true },
      });
      if (!user) {
        return failAction(null, false, 'User:not found !');
      }
      if (!user.password) {
        return failAction(
          null,
          false,
          'Compte invité: veuillez accepter votre invitation pour définir votre mot de passe.',
        );
      }
      const isMatch = await compare(
        updatePasswordDto.currentPassword,
        user.password,
      );
      if (!isMatch) {
        return failAction(null, false, 'Mot de passe actuel incorrect');
      }
      const hashedPassword = await hash(updatePasswordDto.newPassword, 10);
      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
      return successAction(null, true, 'Mot de passe mis à jour avec succès');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async deleteUser(id: string) {
    try {
      const recoveredUser = await this.findById(id);
      if (recoveredUser.success) {
        const userUpdated = await this.prisma.user.update({
          where: {
            id: id,
          },
          data: {
            status: UserStatus.INACTIVE,
          },
        });
        if (userUpdated) {
          return successAction(userUpdated, true, 'User:deleted successfuly !');
        } else {
          return failAction(
            null,
            false,
            "Erreur lors de la mise à jour de l'utilisateur",
          );
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async deleteUserForce(id: string) {
    try {
      const recoveredUser = await this.findById(id);
      if (recoveredUser.success) {
        const userUpdated = await this.prisma.user.delete({
          where: {
            id: id,
          },
        });
        if (userUpdated) {
          return successAction(userUpdated, true, 'User:deleted successfuly !');
        } else {
          return failAction(
            null,
            false,
            "Erreur lors de la suppression de l'utilisateur !",
          );
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
