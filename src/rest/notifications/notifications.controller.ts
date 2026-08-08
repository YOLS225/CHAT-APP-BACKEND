import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { NotificationsService } from '../../business-logic/notifications/notifications.service';
import { JwtAuthGuard } from '../../guard/jwt.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getAuthenticatedUserId(request: Request) {
    return (request.user as { sub: string }).sub;
  }

  @Get()
  @ApiOperation({ summary: 'Get authenticated user notifications' })
  @ApiQuery({ name: 'workspaceId', required: false, type: String })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  list(
    @Req() request: Request,
    @Query('workspaceId') workspaceId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.list(
      this.getAuthenticatedUserId(request),
      workspaceId,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiQuery({ name: 'workspaceId', required: false, type: String })
  unreadCount(
    @Req() request: Request,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.notificationsService.unreadCount(
      this.getAuthenticatedUserId(request),
      workspaceId,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @Req() request: Request) {
    return this.notificationsService.markRead(
      id,
      this.getAuthenticatedUserId(request),
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({ name: 'workspaceId', required: false, type: String })
  markAllRead(
    @Req() request: Request,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.notificationsService.markAllRead(
      this.getAuthenticatedUserId(request),
      workspaceId,
    );
  }
}
