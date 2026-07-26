export class MessageByDay {
  date: string;
  count: number;
}

export type ActivityType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'ROOM_JOINED'
  | 'ROOM_CREATED';

export class RecentActivity {
  type: ActivityType;
  description: string;
  roomId: string;
  roomName: string;
  timestamp: Date;
}

export class TopConversation {
  roomId: string;
  roomName: string;
  messageCount: number;
  lastMessageAt: Date;
}

export class ActiveConversation {
  roomId: string;
  roomName: string;
  lastMessageAt: Date;
  unreadCount?: number;
}

export class UserStatistics {
  messagesByDay: MessageByDay[];
  averageResponseTime: number; // en secondes
  topConversations: TopConversation[];
  activeConversations: ActiveConversation[];
  recentActivities: RecentActivity[];
  totalMessagesSent: number;
}
