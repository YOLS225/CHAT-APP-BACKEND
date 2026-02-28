import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import {
  MessageByDay,
  TopConversation,
  ActiveConversation,
  RecentActivity,
  UserStatistics,
} from './entities/user-statistics.entity';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le nombre de messages par jour pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours à analyser (par défaut 7)
   */
  async getMessageCountByDay(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Récupérer tous les messages de l'utilisateur dans la période
      const messages = await this.prisma.message.findMany({
        where: {
          senderId: userId,
          createdAt: {
            gte: startDate,
          },
          isDeleted: false,
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Grouper par jour
      const messagesByDay: Map<string, number> = new Map();

      // Initialiser tous les jours avec 0
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        messagesByDay.set(dateKey, 0);
      }

      // Compter les messages par jour
      messages.forEach((message) => {
        const dateKey = message.createdAt.toISOString().split('T')[0];
        messagesByDay.set(dateKey, (messagesByDay.get(dateKey) || 0) + 1);
      });

      // Convertir en tableau et trier par date
      const result: MessageByDay[] = Array.from(messagesByDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return successAction(result, true, 'Messages par jour récupérés');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }

  /**
   * Calcule le temps moyen de réponse de l'utilisateur dans ses conversations
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours à analyser (optionnel)
   */
  async getAverageResponseTime(userId: string, days?: number) {
    try {
      const whereClause: any = {
        isDeleted: false,
      };

      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        whereClause.createdAt = { gte: startDate };
      }

      // Récupérer toutes les rooms où l'utilisateur est membre
      const userRooms = await this.prisma.roomMember.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        select: {
          roomId: true,
        },
      });

      const roomIds = userRooms.map((rm) => rm.roomId);

      if (roomIds.length === 0) {
        return successAction(
          { averageResponseTime: 0 },
          true,
          'Aucune conversation trouvée',
        );
      }

      // Récupérer tous les messages des rooms triés par date
      const messages = await this.prisma.message.findMany({
        where: {
          ...whereClause,
          roomId: { in: roomIds },
        },
        select: {
          id: true,
          senderId: true,
          roomId: true,
          createdAt: true,
        },
        orderBy: [{ roomId: 'asc' }, { createdAt: 'asc' }],
      });

      // Calculer les temps de réponse
      const responseTimes: number[] = [];
      let currentRoomId = '';
      let previousMessage: any = null;

      for (const message of messages) {
        // Si on change de room, on reset
        if (message.roomId !== currentRoomId) {
          currentRoomId = message.roomId;
          previousMessage = message;
          continue;
        }

        // Si le message actuel est de l'utilisateur et le précédent d'un autre
        if (
          message.senderId === userId &&
          previousMessage &&
          previousMessage.senderId !== userId
        ) {
          const responseTime =
            (message.createdAt.getTime() - previousMessage.createdAt.getTime()) /
            1000; // en secondes
          responseTimes.push(responseTime);
        }

        previousMessage = message;
      }

      // Calculer la moyenne
      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      return successAction(
        { averageResponseTime: Math.round(averageResponseTime) },
        true,
        'Temps moyen de réponse calculé',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }

  /**
   * Récupère le top des conversations les plus actives pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Nombre de conversations à retourner (par défaut 5)
   */
  async getTopConversations(userId: string, limit: number = 5) {
    try {
      // Récupérer les stats par room
      const messageStats = await this.prisma.message.groupBy({
        by: ['roomId'],
        where: {
          senderId: userId,
          isDeleted: false,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      // Récupérer les infos des rooms et le dernier message
      const topConversations: TopConversation[] = await Promise.all(
        messageStats.map(async (stat) => {
          const room = await this.prisma.room.findUnique({
            where: { id: stat.roomId },
            select: {
              id: true,
              name: true,
              isDirectMessage: true,
              members: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      userName: true,
                    },
                  },
                },
              },
            },
          });

          const lastMessage = await this.prisma.message.findFirst({
            where: {
              roomId: stat.roomId,
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              createdAt: true,
            },
          });

          let displayName = room?.name || 'Conversation inconnue';
          if (room?.isDirectMessage) {
            const otherMember = room.members.find((m) => m.userId !== userId);
            if (otherMember) displayName = otherMember.user.userName;
          }

          return {
            roomId: stat.roomId,
            roomName: displayName,
            messageCount: stat._count.id,
            lastMessageAt: lastMessage?.createdAt || new Date(),
          };
        }),
      );

      return successAction(
        topConversations,
        true,
        'Top conversations récupérées',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }

  /**
   * Récupère les conversations actives (avec activité récente)
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours pour définir "actif" (par défaut 7)
   */
  async getActiveConversations(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les rooms où l'utilisateur est membre
      const userRooms = await this.prisma.roomMember.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        select: {
          roomId: true,
          room: {
            select: {
              id: true,
              name: true,
              isDirectMessage: true,
              members: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      userName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Pour chaque room, vérifier s'il y a eu de l'activité récente
      const activeConversations: ActiveConversation[] = [];

      for (const userRoom of userRooms) {
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            roomId: userRoom.roomId,
            createdAt: {
              gte: startDate,
            },
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            createdAt: true,
          },
        });

        if (lastMessage) {
          let displayName = userRoom.room.name;
          if (userRoom.room.isDirectMessage) {
            const otherMember = userRoom.room.members.find(
              (m) => m.userId !== userId,
            );
            if (otherMember) displayName = otherMember.user.userName;
          }

          activeConversations.push({
            roomId: userRoom.roomId,
            roomName: displayName,
            lastMessageAt: lastMessage.createdAt,
          });
        }
      }

      // Trier par date de dernier message
      activeConversations.sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
      );

      return successAction(
        activeConversations,
        true,
        'Conversations actives récupérées',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }

  /**
   * Récupère les activités récentes de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param limit Nombre d'activités à retourner (par défaut 5)
   */
  async getRecentActivities(userId: string, limit: number = 5) {
    try {
      const fetchCount = limit * 3;

      const messageSelect = {
        content: true,
        createdAt: true,
        roomId: true,
        room: {
          select: {
            name: true,
            isDirectMessage: true,
            members: {
              select: {
                userId: true,
                user: { select: { userName: true } },
              },
            },
          },
        },
      };

      // Récupérer les rooms de l'user pour filtrer les messages reçus
      const userRoomIds = (
        await this.prisma.roomMember.findMany({
          where: { userId, isActive: true },
          select: { roomId: true },
        })
      ).map((r) => r.roomId);

      const [sentMessages, receivedMessages, roomMembers] = await Promise.all([
        this.prisma.message.findMany({
          where: { senderId: userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: fetchCount,
          select: messageSelect,
        }),
        this.prisma.message.findMany({
          where: {
            roomId: { in: userRoomIds },
            senderId: { not: userId },
            isDeleted: false,
          },
          orderBy: { createdAt: 'desc' },
          take: fetchCount,
          select: messageSelect,
        }),
        this.prisma.roomMember.findMany({
          where: { userId },
          orderBy: { joinedAt: 'desc' },
          take: fetchCount,
          select: {
            joinedAt: true,
            role: true,
            roomId: true,
            room: {
              select: {
                name: true,
                isDirectMessage: true,
                isPrivate: true,
                createdAt: true,
                members: {
                  select: {
                    userId: true,
                    user: { select: { userName: true } },
                  },
                },
              },
            },
          },
        }),
      ]);

      const activities: RecentActivity[] = [];

      // Messages envoyés
      for (const msg of sentMessages) {
        let roomName = msg.room.name;
        if (msg.room.isDirectMessage) {
          const other = msg.room.members.find((m) => m.userId !== userId);
          if (other) roomName = other.user.userName;
        }
        const preview =
          msg.content.length > 40
            ? msg.content.slice(0, 40) + '...'
            : msg.content;
        activities.push({
          type: 'MESSAGE_SENT',
          description: `Message envoyé dans ${roomName} : "${preview}"`,
          roomId: msg.roomId,
          roomName,
          timestamp: msg.createdAt,
        });
      }

      // Messages reçus (sans contenu)
      for (const msg of receivedMessages) {
        let roomName = msg.room.name;
        if (msg.room.isDirectMessage) {
          const other = msg.room.members.find((m) => m.userId !== userId);
          if (other) roomName = other.user.userName;
        }
        activities.push({
          type: 'MESSAGE_RECEIVED',
          description: `Nouveau message reçu dans ${roomName}`,
          roomId: msg.roomId,
          roomName,
          timestamp: msg.createdAt,
        });
      }

      // Rooms rejointes / créées
      for (const rm of roomMembers) {
        let roomName = rm.room.name;
        if (rm.room.isDirectMessage) {
          const other = rm.room.members.find((m) => m.userId !== userId);
          if (other) roomName = other.user.userName;
        }

        if (
          rm.role === 'OWNER' &&
          !rm.room.isDirectMessage &&
          !rm.room.isPrivate
        ) {
          activities.push({
            type: 'ROOM_CREATED',
            description: `Vous avez créé la room "${roomName}"`,
            roomId: rm.roomId,
            roomName,
            timestamp: rm.room.createdAt,
          });
        } else if (!rm.room.isDirectMessage) {
          activities.push({
            type: 'ROOM_JOINED',
            description: `Vous avez rejoint "${roomName}"`,
            roomId: rm.roomId,
            roomName,
            timestamp: rm.joinedAt,
          });
        }
      }

      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return successAction(
        activities.slice(0, limit),
        true,
        'Activités récentes récupérées',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }

  /**
   * Récupère toutes les statistiques d'un utilisateur en une seule requête
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours pour l'analyse
   * @param limit Limite pour le top conversations
   */
  async getUserStatisticsOverview(
    userId: string,
    days: number = 7,
    limit: number = 5,
  ) {
    try {
      // Exécuter toutes les requêtes en parallèle
      const [
        messagesByDayResult,
        averageResponseTimeResult,
        topConversationsResult,
        activeConversationsResult,
        recentActivitiesResult,
        totalMessages,
      ] = await Promise.all([
        this.getMessageCountByDay(userId, days),
        this.getAverageResponseTime(userId, days),
        this.getTopConversations(userId, limit),
        this.getActiveConversations(userId, days),
        this.getRecentActivities(userId, limit),
        this.prisma.message.count({
          where: {
            senderId: userId,
            isDeleted: false,
          },
        }),
      ]);

      const statistics: UserStatistics = {
        messagesByDay: messagesByDayResult.data || [],
        averageResponseTime:
          averageResponseTimeResult.data?.averageResponseTime || 0,
        topConversations: topConversationsResult.data || [],
        activeConversations: activeConversationsResult.data || [],
        recentActivities: recentActivitiesResult.data || [],
        totalMessagesSent: totalMessages,
      };

      return successAction(
        statistics,
        true,
        'Statistiques utilisateur récupérées',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Erreur: ${e}`);
    }
  }
}
