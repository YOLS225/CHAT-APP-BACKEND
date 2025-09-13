import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';

export class RoomMember {
  id?: string;
  role?: string;
  isActive?: boolean;
  userId?: string;
  user: User;
  roomId?: string;
  room: Room;
}
