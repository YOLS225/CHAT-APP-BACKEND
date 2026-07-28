import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as XLSX from 'xlsx';
import {
  Prisma,
  RoomRole,
  PlatformRole,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { MailService } from '../mail/mail.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';

type CsvUserRow = {
  email: string;
  userName: string;
  role: WorkspaceRole;
  line: number;
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private canManageWorkspace(role?: WorkspaceRole) {
    return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
  }

  private async findActiveWorkspaceMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  }

  private parseUsersCsv(csv: string) {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return {
        rows: [] as CsvUserRow[],
        errors: ['CSV must contain headers and at least one user'],
      };
    }

    const headers = this.parseCsvLine(lines[0]).map((header) =>
      header.toLowerCase(),
    );
    const emailIndex = headers.indexOf('email');
    const userNameIndex = headers.indexOf('username');
    const roleIndex = headers.indexOf('role');
    const errors: string[] = [];
    const rows: CsvUserRow[] = [];
    const seenEmails = new Set<string>();

    if (emailIndex === -1) errors.push('Missing email column');
    if (userNameIndex === -1) errors.push('Missing userName column');
    if (roleIndex === -1) errors.push('Missing role column');
    if (errors.length > 0) return { rows, errors };

    for (let i = 1; i < lines.length; i += 1) {
      const values = this.parseCsvLine(lines[i]);
      const email = values[emailIndex]?.toLowerCase();
      const userName = values[userNameIndex];
      const roleValue = values[roleIndex] || WorkspaceRole.MEMBER;
      const line = i + 1;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Line ${line}: invalid email`);
        continue;
      }

      if (!userName) {
        errors.push(`Line ${line}: missing userName`);
        continue;
      }

      if (seenEmails.has(email)) {
        errors.push(`Line ${line}: duplicate email in file`);
        continue;
      }

      if (!Object.values(WorkspaceRole).includes(roleValue as WorkspaceRole)) {
        errors.push(`Line ${line}: invalid role`);
        continue;
      }

      seenEmails.add(email);
      rows.push({
        email,
        userName,
        role: roleValue as WorkspaceRole,
        line,
      });
    }

    return { rows, errors };
  }

  private buildInvitationUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/accept-invitation?token=${token}`;
  }

  private spreadsheetBufferToCsv(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return null;
    }

    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  async create(dto: CreateWorkspaceDto, ownerId: string) {
    try {
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { platformRole: true },
      });
      if (owner?.platformRole !== PlatformRole.SUPER_ADMIN) {
        return failAction(
          null,
          false,
          'Only platform admins can create workspaces',
        );
      }

      const workspace = await this.prisma.$transaction(async (tx) => {
        const created = await tx.workspace.create({
          data: {
            name: dto.name,
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: created.id,
            userId: ownerId,
            role: WorkspaceRole.OWNER,
            status: WorkspaceMemberStatus.ACTIVE,
          },
        });

        return created;
      });

      return successAction(workspace, true, 'Workspace created successfully');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async findMine(userId: string) {
    try {
      const memberships = await this.prisma.workspaceMember.findMany({
        where: {
          userId,
          status: WorkspaceMemberStatus.ACTIVE,
        },
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      return successAction(
        memberships.map((membership) => ({
          ...membership.workspace,
          role: membership.role,
        })),
        true,
        'Workspaces found',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async getUsers(workspaceId: string, actorUserId: string, search?: string) {
    try {
      const actor = await this.findActiveWorkspaceMember(
        workspaceId,
        actorUserId,
      );
      if (!actor || actor.status !== WorkspaceMemberStatus.ACTIVE) {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      const members = await this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          status: { not: WorkspaceMemberStatus.DISABLED },
          ...(search?.trim() && {
            user: {
              OR: [
                {
                  userName: {
                    contains: search.trim(),
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  email: {
                    contains: search.trim(),
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          }),
        },
        select: {
          id: true,
          role: true,
          status: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
              avatar: true,
              isOnline: true,
              lastSeen: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      return successAction(
        members.map((member) => ({
          id: member.user.id,
          userName: member.user.userName,
          email: member.user.email,
          avatar: member.user.avatar,
          isOnline: member.user.isOnline,
          lastSeen: member.user.lastSeen,
          role: member.role,
          memberId: member.id,
          membershipStatus: member.status,
        })),
        true,
        'Workspace users found',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async updateMember(
    workspaceId: string,
    targetUserId: string,
    actorUserId: string,
    dto: UpdateWorkspaceMemberDto,
  ) {
    try {
      const [actor, target] = await Promise.all([
        this.findActiveWorkspaceMember(workspaceId, actorUserId),
        this.prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId: targetUserId,
            },
          },
          select: {
            id: true,
            role: true,
            status: true,
            userId: true,
          },
        }),
      ]);

      if (
        !actor ||
        actor.status !== WorkspaceMemberStatus.ACTIVE ||
        !this.canManageWorkspace(actor.role)
      ) {
        return failAction(null, false, 'Insufficient permissions');
      }

      if (!target) {
        return failAction(null, false, 'Workspace member not found');
      }

      if (
        target.role === WorkspaceRole.OWNER &&
        actor.role !== WorkspaceRole.OWNER
      ) {
        return failAction(
          null,
          false,
          'Only an owner can modify another owner',
        );
      }

      if (
        dto.role === WorkspaceRole.OWNER &&
        actor.role !== WorkspaceRole.OWNER
      ) {
        return failAction(null, false, 'Only an owner can assign owner role');
      }

      if (
        target.userId === actorUserId &&
        dto.status === WorkspaceMemberStatus.DISABLED
      ) {
        return failAction(
          null,
          false,
          'You cannot disable your own membership',
        );
      }

      const updated = await this.prisma.workspaceMember.update({
        where: { id: target.id },
        data: {
          role: dto.role,
          status: dto.status,
        },
        select: {
          id: true,
          role: true,
          status: true,
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
              avatar: true,
              isOnline: true,
            },
          },
        },
      });

      return successAction(updated, true, 'Workspace member updated');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async disableMember(
    workspaceId: string,
    targetUserId: string,
    actorUserId: string,
  ) {
    return this.updateMember(workspaceId, targetUserId, actorUserId, {
      status: WorkspaceMemberStatus.DISABLED,
    });
  }

  private async importUsersFromCsv(
    workspaceId: string,
    actorUserId: string,
    csv: string,
    dryRun?: boolean,
  ) {
    try {
      const actor = await this.findActiveWorkspaceMember(
        workspaceId,
        actorUserId,
      );
      if (
        !actor ||
        actor.status !== WorkspaceMemberStatus.ACTIVE ||
        !this.canManageWorkspace(actor.role)
      ) {
        return failAction(null, false, 'Insufficient permissions');
      }

      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });
      if (!workspace) {
        return failAction(null, false, 'Workspace not found');
      }

      const { rows, errors } = this.parseUsersCsv(csv);
      if (errors.length > 0) {
        return failAction({ errors }, false, 'CSV validation failed');
      }

      const emails = rows.map((row) => row.email);
      const userNames = rows.map((row) => row.userName);
      const [existingUsers, existingMemberships] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            OR: [{ email: { in: emails } }, { userName: { in: userNames } }],
          },
          select: { id: true, email: true, userName: true },
        }),
        this.prisma.workspaceMember.findMany({
          where: {
            workspaceId,
            user: { email: { in: emails } },
          },
          select: {
            user: { select: { email: true } },
            status: true,
          },
        }),
      ]);

      const existingByEmail = new Map(
        existingUsers.map((user) => [user.email.toLowerCase(), user]),
      );
      const existingUserNameByOtherEmail = new Map(
        existingUsers.map((user) => [user.userName, user.email.toLowerCase()]),
      );
      const membershipByEmail = new Map(
        existingMemberships.map((member) => [
          member.user.email.toLowerCase(),
          member.status,
        ]),
      );

      const validationErrors = rows.flatMap((row) => {
        const userNameOwnerEmail = existingUserNameByOtherEmail.get(
          row.userName,
        );
        if (userNameOwnerEmail && userNameOwnerEmail !== row.email) {
          return [`Line ${row.line}: userName already used by another user`];
        }
        return [];
      });

      if (validationErrors.length > 0) {
        return failAction(
          { errors: validationErrors },
          false,
          'CSV validation failed',
        );
      }

      const preview = rows.map((row) => ({
        email: row.email,
        userName: row.userName,
        role: row.role,
        action: membershipByEmail.has(row.email)
          ? 'already_member'
          : existingByEmail.has(row.email)
            ? 'attach_existing_user'
            : 'create_invited_user',
      }));

      if (dryRun) {
        return successAction({ preview }, true, 'CSV import preview');
      }

      const imported = await this.prisma.$transaction(async (tx) => {
        const results: Array<{
          email: string;
          userName: string;
          userId: string;
          action: string;
          invitationUrl?: string;
        }> = [];

        for (const row of rows) {
          const existingMembership = membershipByEmail.get(row.email);
          if (existingMembership) {
            results.push({
              email: row.email,
              userName: row.userName,
              userId: existingByEmail.get(row.email)?.id || '',
              action: 'already_member',
            });
            continue;
          }

          const user =
            existingByEmail.get(row.email) ||
            (await tx.user.create({
              data: {
                email: row.email,
                userName: row.userName,
                password: null,
              },
              select: { id: true, email: true },
            }));

          await tx.workspaceMember.create({
            data: {
              workspaceId,
              userId: user.id,
              role: row.role,
              status: WorkspaceMemberStatus.INVITED,
            },
          });

          const token = randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await tx.invitationToken.create({
            data: {
              token,
              userId: user.id,
              workspaceId,
              expiresAt,
            },
          });

          results.push({
            email: row.email,
            userName: row.userName,
            userId: user.id,
            action: existingByEmail.has(row.email)
              ? 'attached_existing_user'
              : 'created_invited_user',
            invitationUrl: this.buildInvitationUrl(token),
          });
        }

        return results;
      });

      const importedWithEmailStatus = await Promise.all(
        imported.map(async (result) => {
          if (!result.invitationUrl) {
            return {
              ...result,
              emailSent: false,
              emailSkipped: true,
            };
          }

          try {
            const delivery = await this.mailService.sendInvitationEmail({
              to: result.email,
              userName: result.userName,
              workspaceName: workspace.name,
              invitationUrl: result.invitationUrl,
            });

            return {
              ...result,
              emailSent: delivery.sent,
              emailSkipped: delivery.skipped,
            };
          } catch (error) {
            console.error(error);
            return {
              ...result,
              emailSent: false,
              emailSkipped: false,
              emailError:
                error instanceof Error ? error.message : 'Email send failed',
            };
          }
        }),
      );

      return successAction(
        { imported: importedWithEmailStatus },
        true,
        'Users imported successfully',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async importUsersFromSpreadsheet(
    workspaceId: string,
    actorUserId: string,
    file: Express.Multer.File | undefined,
    dryRun?: boolean,
  ) {
    if (!file) {
      return failAction(null, false, 'No file provided');
    }

    const allowedMimeTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
      'text/plain',
    ]);

    const allowedExtensions = /\.(xlsx|xls|csv)$/i;
    if (
      !allowedMimeTypes.has(file.mimetype) &&
      !allowedExtensions.test(file.originalname)
    ) {
      return failAction(
        null,
        false,
        'Invalid file type. Expected .xlsx, .xls or .csv',
      );
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return failAction(null, false, 'File is too large. Max size is 2MB');
    }

    const csv = this.spreadsheetBufferToCsv(file);
    if (!csv) {
      return failAction(null, false, 'Spreadsheet is empty');
    }

    return this.importUsersFromCsv(workspaceId, actorUserId, csv, dryRun);
  }

  async createDirectMessage(
    workspaceId: string,
    actorUserId: string,
    targetUserId: string,
  ) {
    try {
      if (actorUserId === targetUserId) {
        return failAction(null, false, 'Cannot create a DM with yourself');
      }

      const [actor, target] = await Promise.all([
        this.findActiveWorkspaceMember(workspaceId, actorUserId),
        this.findActiveWorkspaceMember(workspaceId, targetUserId),
      ]);

      if (!actor || actor.status !== WorkspaceMemberStatus.ACTIVE) {
        return failAction(
          null,
          false,
          'User is not a member of this workspace',
        );
      }

      if (!target || target.status !== WorkspaceMemberStatus.ACTIVE) {
        return failAction(
          null,
          false,
          'Target user is not active in this workspace',
        );
      }

      const existingDm = await this.prisma.room.findFirst({
        where: {
          workspaceId,
          isDirectMessage: true,
          members: {
            every: {
              userId: { in: [actorUserId, targetUserId] },
            },
          },
        },
        include: {
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
        },
      });

      if (
        existingDm &&
        existingDm.members.length === 2 &&
        existingDm.members.some((member) => member.userId === actorUserId) &&
        existingDm.members.some((member) => member.userId === targetUserId)
      ) {
        const otherMember = existingDm.members.find(
          (member) => member.userId !== actorUserId,
        );
        return successAction(
          {
            id: existingDm.id,
            name: existingDm.name,
            displayName: otherMember?.user.userName || existingDm.name,
            description: existingDm.description,
            isPrivate: existingDm.isPrivate,
            isDirectMessage: existingDm.isDirectMessage,
            createdAt: existingDm.createdAt,
            otherUser: otherMember?.user || null,
            lastMessage: null,
          },
          true,
          'Direct message already exists',
        );
      }

      const room = await this.prisma.$transaction(async (tx) => {
        const created = await tx.room.create({
          data: {
            workspaceId,
            name: `dm:${actorUserId}:${targetUserId}`,
            isPrivate: true,
            isDirectMessage: true,
          },
        });

        await tx.roomMember.createMany({
          data: [
            {
              roomId: created.id,
              userId: actorUserId,
              role: RoomRole.MEMBER,
            },
            {
              roomId: created.id,
              userId: targetUserId,
              role: RoomRole.MEMBER,
            },
          ],
        });

        return tx.room.findUnique({
          where: { id: created.id },
          include: {
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
          },
        });
      });

      const otherMember = room?.members.find(
        (member) => member.userId !== actorUserId,
      );

      return successAction(
        room
          ? {
              id: room.id,
              name: room.name,
              displayName: otherMember?.user.userName || room.name,
              description: room.description,
              isPrivate: room.isPrivate,
              isDirectMessage: room.isDirectMessage,
              createdAt: room.createdAt,
              otherUser: otherMember?.user || null,
              lastMessage: null,
            }
          : null,
        true,
        'Direct message created successfully',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
