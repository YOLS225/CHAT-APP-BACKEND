import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  name: string;
  @ApiProperty({ example: 'string' })
  description?: string;
  @ApiProperty({ example: true })
  isPrivate?: boolean;
  @ApiProperty({ example: true })
  isDeleted?: boolean;
  createdAt?: Date;
  // @ApiProperty({ type: () => [RoomMember] })
  // members: RoomMember[];
  // @ApiProperty({ type: () => [Message] })
  // messages: Message[];
  @ApiProperty({ example: true })
  isDirectMessage?: boolean;
}
