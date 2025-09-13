import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomMemberDto } from './create-room-member.dto';

export class UpdateRoomMemberDto extends PartialType(CreateRoomMemberDto) {}
