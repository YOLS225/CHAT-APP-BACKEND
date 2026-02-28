import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from '../../business-logic/statistics/statistics.service';
import { GetStatisticsDto } from '../../business-logic/statistics/dto/get-statistics.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * GET /statistics/user/:userId/messages-by-day
   * Récupère le nombre de messages par jour
   */
  @Get('user/:userId/messages-by-day')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMessagesByDay(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getMessageCountByDay(userId, query.days);
  }

  /**
   * GET /statistics/user/:userId/average-response-time
   * Récupère le temps moyen de réponse
   */
  @Get('user/:userId/average-response-time')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAverageResponseTime(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getAverageResponseTime(userId, query.days);
  }

  /**
   * GET /statistics/user/:userId/top-conversations
   * Récupère le top des conversations
   */
  @Get('user/:userId/top-conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getTopConversations(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getTopConversations(userId, query.limit);
  }

  /**
   * GET /statistics/user/:userId/active-conversations
   * Récupère les conversations actives
   */
  @Get('user/:userId/active-conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getActiveConversations(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getActiveConversations(userId, query.days);
  }

  /**
   * GET /statistics/user/:userId/recent-activities
   * Récupère les activités récentes de l'utilisateur
   */
  @Get('user/:userId/recent-activities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRecentActivities(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getRecentActivities(userId, query.limit);
  }

  /**
   * GET /statistics/user/:userId/overview
   * Récupère toutes les statistiques en une seule requête
   */
  @Get('user/:userId/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getOverview(
    @Param('userId') userId: string,
    @Query() query: GetStatisticsDto,
  ) {
    return this.statisticsService.getUserStatisticsOverview(
      userId,
      query.days,
      query.limit,
    );
  }
}
