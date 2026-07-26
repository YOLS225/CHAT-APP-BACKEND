import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateUserDto {
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
  @IsUrl({ require_tld: false })
  avatar?: string;
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
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
