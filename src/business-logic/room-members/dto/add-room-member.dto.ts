import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RoomRole } from '../../../../generated/prisma';

export class AddRoomMemberDto {
  @ApiProperty({ example: 'user-id' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: RoomRole, example: RoomRole.MEMBER })
  @IsOptional()
  @IsEnum(RoomRole)
  role?: RoomRole;
}
