import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  userName: string;
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  password: string;
  @ApiProperty({ example: 'string' })
  @IsOptional()
  @IsString()
  avatar?: string;
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
  @IsOptional()
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
