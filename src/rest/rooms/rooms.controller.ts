import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RoomsService } from '../../business-logic/rooms/rooms.service';
import { CreateRoomDto } from '../../business-logic/rooms/dto/create-room.dto';
import { UpdateRoomDto } from '../../business-logic/rooms/dto/update-room.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { normalizePagination } from '../../utils/pagination';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  private getAuthenticatedUserId(request: Request) {
    return (request.user as { sub: string }).sub;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a room' })
  create(@Body() createRoomDto: CreateRoomDto, @Req() request: Request) {
    return this.roomsService.create(
      createRoomDto,
      this.getAuthenticatedUserId(request),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isDirectMessage', required: false, type: Boolean })
  findAll(
    @Req() request: Request,
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
    @Query('isDirectMessage') isDirectMessage?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const isDirectMessageBool =
      isDirectMessage === 'true'
        ? true
        : isDirectMessage === 'false'
          ? false
          : undefined;
    const pagination = normalizePagination(page, page_size);
    return this.roomsService.findAll(
      pagination.page,
      pagination.pageSize,
      this.getAuthenticatedUserId(request),
      workspaceId,
      search,
      isDirectMessageBool,
    );
  }

  @Get('members/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members in room' })
  getRoomMembers(@Param('id') id: string, @Req() request: Request) {
    return this.roomsService.getRoomMembers(
      id,
      this.getAuthenticatedUserId(request),
    );
  }

  @Get('user-rooms/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rooms (chat/groups) for user' })
  @ApiQuery({ name: 'isDirectMessage', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUserRooms(
    @Req() request: Request,
    @Param('id') id: string,
    @Query('isDirectMessage') isDirectMessage?: string,
    @Query('search') search?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    if (this.getAuthenticatedUserId(request) !== id) {
      throw new ForbiddenException('You can only list your own rooms');
    }
    const isDirectMessageBool =
      isDirectMessage === 'true'
        ? true
        : isDirectMessage === 'false'
          ? false
          : undefined;
    return this.roomsService.getUserRooms(
      id,
      workspaceId,
      isDirectMessageBool,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a room' })
  findById(@Param('id') id: string, @Req() request: Request) {
    return this.roomsService.findById(id, this.getAuthenticatedUserId(request));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a room' })
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Req() request: Request,
  ) {
    return this.roomsService.update(
      id,
      this.getAuthenticatedUserId(request),
      updateRoomDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a room' })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.roomsService.remove(id, this.getAuthenticatedUserId(request));
  }
}
