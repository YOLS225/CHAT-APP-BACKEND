import { ApiProperty } from '@nestjs/swagger';
import { RoomMember } from '../../room-members/entities/room-member.entity';
import { Message } from '../../messages/entities/message.entity';

export class CreateRoomDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  name?: string;
  @ApiProperty({ example: 'string' })
  description?: string;
  @ApiProperty({ example: true })
  isPrivate?: boolean;
  @ApiProperty({ example: true })
  isDeleted?: boolean;
  createdAt?: Date;
  @ApiProperty({ type: () => [RoomMember] })
  members: RoomMember[];
  @ApiProperty({ type: () => [Message] })
  messages: Message[];
  @ApiProperty({ example: true })
  isDirectMessage?: boolean;
}
