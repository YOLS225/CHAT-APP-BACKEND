import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/types';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
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
