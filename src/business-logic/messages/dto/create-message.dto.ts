import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../../utils/types';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMessageDto {
  @ApiPropertyOptional({ example: 'string' })
  @IsOptional()
  @IsString()
  content?: string;
  @ApiProperty({ example: 'string' })
  @IsUUID()
  roomId: string;
  // @ApiProperty({ type: () => [Room] })
  // room: Room;
  @ApiProperty({ enum: MessageType, example: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ example: ['attachment-id'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  attachmentIds?: string[];
}
