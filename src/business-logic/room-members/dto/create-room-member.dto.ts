import { ApiProperty } from '@nestjs/swagger';
import { RoomRole } from '../../../utils/types';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';

export class CreateRoomMemberDto {
  id?: string;
  @ApiProperty({ enum: RoomRole, example: RoomRole.MEMBER })
  role?: string;
  @ApiProperty({ example: true })
  isActive?: boolean;
  @ApiProperty({ example: 'string' })
  userId?: string;
  @ApiProperty({ type: () => [User] })
  user: User;
  @ApiProperty({ example: 'string' })
  roomId?: string;
  @ApiProperty({ type: () => [Room] })
  room: Room;
}
