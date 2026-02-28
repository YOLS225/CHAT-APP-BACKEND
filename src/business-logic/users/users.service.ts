import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { UserStatus } from '../../utils/types';
import { hash, compare } from 'bcrypt';
import { UpdateUserDto, UpdatePasswordDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

      const createdUser = await this.prisma.user.create({
        data: {
          userName: createUserDto.userName,
          email: createUserDto.email,
          password: hashedPassword,
          avatar: createUserDto.avatar,
          isOnline: createUserDto.isOnline || false,
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

      if (createdUser) {
        return successAction(createdUser, true, 'User:Created successfuly !');
      }
      return failAction(null, false, 'Error during user creation !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findAll(page: number, page_size: number, search?: string) {
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
      if (!recoveredUser) {
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
      if (recoveredUser) {
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
      if (recoveredUser) {
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
