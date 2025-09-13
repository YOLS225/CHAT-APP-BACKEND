import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';
import { MessageType } from '../../../utils/types';

export class Message {
  id?: string;
  content?: string;
  senderId?: string;
  sender: User;
  roomId?: string;
  room: Room;
  type?: MessageType;
  isDeleted?: boolean;
  createdAt?: Date;
}
