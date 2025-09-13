import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/types';
import { IsEmail } from 'class-validator';

export class CreateUserDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  userName: string;
  @ApiProperty({ example: 'string' })
  @IsEmail()
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
  // @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  // status?: UserStatus;
}

export class UserResponseDto {
  id: string;
  userName: string;
  email?: string;
  avatar?: string;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;
  status: UserStatus;
}
