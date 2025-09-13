import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../../../utils/types';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';

export class CreateMessageDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  content?: string;
  @ApiProperty({ example: 'string' })
  senderId?: string;
  @ApiProperty({ type: () => [User] })
  sender: User;
  @ApiProperty({ example: 'string' })
  roomId?: string;
  @ApiProperty({ type: () => [Room] })
  room: Room;
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  type?: MessageType;
  @ApiProperty({ example: true })
  isDeleted?: boolean;
  createdAt?: Date;
}
