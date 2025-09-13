import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from '../../business-logic/users/users.service';
import { CreateUserDto } from '../../business-logic/users/dto/create-user.dto';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create User' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.save(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Users with pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(Number(page), Number(page_size), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an User' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit an User' })
  update(@Param('id') id: string, @Body() updateUserDto: CreateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate an User' })
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Delete('force/:id')
  @ApiOperation({ summary: 'Delete User' })
  forceRemove(@Param('id') id: string) {
    return this.usersService.deleteUserForce(id);
  }
}
