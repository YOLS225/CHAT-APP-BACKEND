import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '../../../../generated/prisma';

export class UpdateWorkspaceMemberDto {
  @ApiProperty({ enum: WorkspaceRole, required: false })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;

  @ApiProperty({ enum: WorkspaceMemberStatus, required: false })
  @IsOptional()
  @IsEnum(WorkspaceMemberStatus)
  status?: WorkspaceMemberStatus;
}
