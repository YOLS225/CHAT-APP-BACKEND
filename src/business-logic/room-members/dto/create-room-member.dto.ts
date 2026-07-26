import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRoomMemberDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  @IsUUID()
  roomId: string;
}
