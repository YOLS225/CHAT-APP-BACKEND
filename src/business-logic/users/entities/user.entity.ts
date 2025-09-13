import { Message } from '../../messages/entities/message.entity';
import { RoomMember } from '../../room-members/entities/room-member.entity';

export class User {
  id?: string;
  userName?: string;
  email: string;
  password?: string;
  avatar?: string;
  isOnline?: boolean;
  createdAt?: Date;
  sentMessages: Message[];
  roomMemberships: RoomMember[];
  status?: string;
}
