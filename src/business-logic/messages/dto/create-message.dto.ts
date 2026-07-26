import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../../../utils/types';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMessageDto {
  id?: string;
  @ApiProperty({ example: 'string' })
  @IsString()
  @IsNotEmpty()
  content: string;
  @ApiProperty({ example: 'string' })
  @IsUUID()
  roomId: string;
  // @ApiProperty({ type: () => [Room] })
  // room: Room;
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
  createdAt?: Date;
}
