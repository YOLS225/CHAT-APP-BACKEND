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
import { RoomsService } from '../../business-logic/rooms/rooms.service';
import { CreateRoomDto } from '../../business-logic/rooms/dto/create-room.dto';
import { UpdateRoomDto } from '../../business-logic/rooms/dto/update-room.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a room' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all rooms' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isDirectMessage', required: false, type: Boolean })
  findAll(
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
    @Query('isDirectMessage') isDirectMessage?: string,
  ) {
    const isDirectMessageBool =
      isDirectMessage === 'true'
        ? true
        : isDirectMessage === 'false'
          ? false
          : undefined;
    return this.roomsService.findAll(
      Number(page),
      Number(page_size),
      search,
      isDirectMessageBool,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a room' })
  findById(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Get('members/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members in room' })
  getRoomMembers(@Param('id') id: string) {
    return this.roomsService.getRoomMembers(id);
  }

  @Get('user/rooms/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rooms (chat/groups) for user' })
  @ApiQuery({ name: 'isDirectMessage', required: false, type: Boolean })
  getUserRooms(
    @Param('id') id: string,
    @Query('isDirectMessage') isDirectMessage?: string,
  ) {
    const isDirectMessageBool =
      isDirectMessage === 'true'
        ? true
        : isDirectMessage === 'false'
          ? false
          : undefined;
    return this.roomsService.getUserRooms(id, isDirectMessageBool);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a room' })
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a room' })
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
