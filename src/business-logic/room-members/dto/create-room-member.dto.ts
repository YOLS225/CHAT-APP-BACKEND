import { ApiProperty } from '@nestjs/swagger';
import { RoomRole } from '../../../utils/types';

export class CreateRoomMemberDto {
  id?: string;
  @ApiProperty({ enum: RoomRole, example: RoomRole.MEMBER, required: false })
  role?: RoomRole;
  @ApiProperty({ example: true })
  isActive?: boolean;
  @ApiProperty({ example: 'string' })
  userId: string;
  @ApiProperty({ example: 'string' })
  roomId: string;
}
