import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiProperty({ example: 'string', required: false })
  @IsOptional()
  @IsString()
  name?: string;
  @ApiProperty({ example: 'string', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
