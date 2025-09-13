import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomMembersService } from '../../business-logic/room-members/room-members.service';
import { CreateRoomMemberDto } from '../../business-logic/room-members/dto/create-room-member.dto';
import { UpdateRoomMemberDto } from '../../business-logic/room-members/dto/update-room-member.dto';

@Controller('room-members')
export class RoomMembersController {
  constructor(private readonly roomMembersService: RoomMembersService) {}

  @Post()
  create(@Body() createRoomMemberDto: CreateRoomMemberDto) {
    return this.roomMembersService.create(createRoomMemberDto);
  }

  @Get()
  findAll() {
    return this.roomMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomMembersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomMemberDto: UpdateRoomMemberDto) {
    return this.roomMembersService.update(+id, updateRoomMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomMembersService.remove(+id);
  }
}
