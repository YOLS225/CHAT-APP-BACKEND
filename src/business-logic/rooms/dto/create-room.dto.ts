import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  name: string;
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  workspaceId: string;
  @ApiProperty({ example: 'string' })
  @IsOptional()
  @IsString()
  description?: string;
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isDirectMessage?: boolean;
}
