import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiProperty({ example: 'string' })
  name: string;
  @ApiProperty({ example: 'string' })
  description?: string;
}
