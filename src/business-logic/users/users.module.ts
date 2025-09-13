import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from '../../rest/users/users.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
