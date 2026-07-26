import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../../business-logic/users/users.service';
import { CreateUserDto } from '../../business-logic/users/dto/create-user.dto';
import {
  UpdateUserDto,
  UpdatePasswordDto,
} from '../../business-logic/users/dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guard/jwt.guard';
import { normalizePagination } from '../../utils/pagination';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private assertSelf(request: Request, userId: string) {
    const authenticatedUserId = (request.user as { sub?: string })?.sub;
    if (authenticatedUserId !== userId) {
      throw new ForbiddenException('You can only modify your own account');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create User' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.save(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page: string,
    @Query('page_size') page_size: string,
    @Query('search') search?: string,
    @Query('workspaceId') workspaceId?: string,
    @Req() request?: Request,
  ) {
    const pagination = normalizePagination(page, page_size);
    return this.usersService.findAll(
      pagination.page,
      pagination.pageSize,
      (request?.user as { sub: string }).sub,
      workspaceId,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an User' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update username, email or avatar' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    this.assertSelf(request, id);
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update password' })
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    this.assertSelf(request, id);
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Delete('force/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete User' })
  @ApiBearerAuth()
  forceRemove(@Param('id') id: string, @Req() request: Request) {
    this.assertSelf(request, id);
    return this.usersService.deleteUserForce(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an User' })
  remove(@Param('id') id: string, @Req() request: Request) {
    this.assertSelf(request, id);
    return this.usersService.deleteUser(id);
  }
}
