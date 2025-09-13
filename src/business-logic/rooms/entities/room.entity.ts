import { RoomMember } from '../../room-members/entities/room-member.entity';
import { Message } from '../../messages/entities/message.entity';

export class Room {
  id?: string;
  name?: string;
  description?: string;
  isPrivate?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  members: RoomMember[];
  messages: Message[];
  isDirectMessage?: boolean;
}
