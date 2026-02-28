import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoomRole } from '../../../../generated/prisma';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: RoomRole, example: RoomRole.ADMIN })
  @IsEnum(RoomRole)
  role: RoomRole;
}