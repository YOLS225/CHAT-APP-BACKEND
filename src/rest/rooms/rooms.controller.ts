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
  findAll(
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
  ) {
    return this.roomsService.findAll(Number(page), Number(page_size), search);
  }

  @Get('public')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all public rooms' })
  @ApiQuery({ name: 'search', required: false, type: String })
  getPublicRooms(
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
  ) {
    return this.roomsService.getPublicRooms(
      Number(page),
      Number(page_size),
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a room' })
  findById(@Param('id') id: string) {
    return this.roomsService.findById(id);
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
