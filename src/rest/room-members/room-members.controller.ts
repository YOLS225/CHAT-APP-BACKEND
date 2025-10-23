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
} from '@nestjs/common';
import { RoomMembersService } from '../../business-logic/room-members/room-members.service';
import { CreateRoomMemberDto } from '../../business-logic/room-members/dto/create-room-member.dto';
// import { UpdateRoomMemberDto } from '../../business-logic/room-members/dto/update-room-member.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('room-members')
export class RoomMembersController {
  constructor(private readonly roomMembersService: RoomMembersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a Room' })
  create(@Body() createRoomMemberDto: CreateRoomMemberDto) {
    return this.roomMembersService.joinRoom(createRoomMemberDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all Room-members' })
  findAll(@Query('page') page: string, @Query('page_size') page_size: string) {
    return this.roomMembersService.findAll(Number(page), Number(page_size));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Member' })
  findById(@Param('id') id: string) {
    return this.roomMembersService.findById(id);
  }

  // @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Edit a Member' })
  // update(
  //   @Param('id') id: string,
  //   @Body() updateRoomMemberDto: UpdateRoomMemberDto,
  // ) {
  //   return this.roomMembersService.update(id, updateRoomMemberDto);
  // }

  @Patch('leave/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a Room' })
  leaveRoom(@Param('id') id: string) {
    return this.roomMembersService.leaveRoom(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Member' })
  remove(@Param('id') id: string) {
    return this.roomMembersService.removeMember(id);
  }
}
