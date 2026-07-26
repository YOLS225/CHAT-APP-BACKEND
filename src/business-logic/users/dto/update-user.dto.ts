import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'johndoe', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userName?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
