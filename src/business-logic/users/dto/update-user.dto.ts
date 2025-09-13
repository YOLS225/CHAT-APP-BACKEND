import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/types';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  id?: string;
  @ApiProperty({ example: 'string' })
  userName: string;
  @ApiProperty({ example: 'string' })
  email: string;
  @ApiProperty({ example: 'string' })
  password: string;
  @ApiProperty({ example: 'string' })
  avatar?: string;
  @ApiProperty({ example: true })
  isOnline?: boolean;
  createdAt?: Date;
  // @ApiProperty({ type: () => [Message] })
  // sentMessages: Message[];
  // @ApiProperty({ type: () => [RoomMember] })
  // roomMemberships: RoomMember[];
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status?: UserStatus;
}
