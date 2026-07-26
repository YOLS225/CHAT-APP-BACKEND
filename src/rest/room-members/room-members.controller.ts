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
} from '@nestjs/common';
import type { Request } from 'express';
import { RoomMembersService } from '../../business-logic/room-members/room-members.service';
import { CreateRoomMemberDto } from '../../business-logic/room-members/dto/create-room-member.dto';
import { UpdateMemberRoleDto } from '../../business-logic/room-members/dto/update-room-member.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { normalizePagination } from '../../utils/pagination';

@Controller('room-members')
export class RoomMembersController {
  constructor(private readonly roomMembersService: RoomMembersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a Room' })
  create(
    @Body() createRoomMemberDto: CreateRoomMemberDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as { sub: string }).sub;
    return this.roomMembersService.joinRoom(createRoomMemberDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all Room-members' })
  findAll(@Query('page') page: string, @Query('page_size') page_size: string) {
    const pagination = normalizePagination(page, page_size);
    return this.roomMembersService.findAll(
      pagination.page,
      pagination.pageSize,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Member' })
  findById(@Param('id') id: string) {
    return this.roomMembersService.findById(id);
  }

  @Patch(':memberId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role (OWNER/ADMIN only)' })
  updateRole(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() request: Request,
  ) {
    const actorUserId = (request.user as { sub: string }).sub;
    return this.roomMembersService.updateMemberRole(memberId, actorUserId, dto);
  }

  @Delete(':memberId/kick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kick a member (OWNER/ADMIN only)' })
  kick(@Param('memberId') memberId: string, @Req() request: Request) {
    const actorUserId = (request.user as { sub: string }).sub;
    return this.roomMembersService.kickMember(memberId, actorUserId);
  }

  @Patch('leave/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a Room' })
  leaveRoom(@Param('id') id: string, @Req() request: Request) {
    const userId = (request.user as { sub: string }).sub;
    return this.roomMembersService.leaveRoom(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Member' })
  remove(@Param('id') id: string, @Req() request: Request) {
    const actorUserId = (request.user as { sub: string }).sub;
    return this.roomMembersService.removeMember(id, actorUserId);
  }
}
