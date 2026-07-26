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
import { MessagesService } from '../../business-logic/messages/messages.service';
import { CreateMessageDto } from '../../business-logic/messages/dto/create-message.dto';
import { UpdateMessageDto } from '../../business-logic/messages/dto/update-message.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a message' })
  create(@Body() createMessageDto: CreateMessageDto, @Req() request: Request) {
    const senderId = (request.user as { sub: string }).sub;
    return this.messagesService.create(createMessageDto, senderId);
  }

  @Get('room/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages for a room' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllMessages(
    @Param('id') id: string,
    @Query('search') search: string | undefined,
    @Req() request: Request,
  ) {
    const userId = (request.user as { sub: string }).sub;
    return this.messagesService.findAllMessages(id, userId, search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a message' })
  findOne(@Param('id') id: string, @Req() request: Request) {
    const userId = (request.user as { sub: string }).sub;
    return this.messagesService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a message' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as { sub: string }).sub;
    return this.messagesService.update(id, userId, updateMessageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a message' })
  remove(@Param('id') id: string, @Req() request: Request) {
    const userId = (request.user as { sub: string }).sub;
    return this.messagesService.remove(id, userId);
  }
}
