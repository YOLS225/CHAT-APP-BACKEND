import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from '../../business-logic/messages/messages.service';
import { CreateMessageDto } from '../../business-logic/messages/dto/create-message.dto';
import { UpdateMessageDto } from '../../business-logic/messages/dto/update-message.dto';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a message' })
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages' })
  findAll() {
    return this.messagesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a message' })
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Get('room/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages for a room' })
  findAllMessages(@Param('id') id: string) {
    return this.messagesService.findAllMessages(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a message' })
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a message' })
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
