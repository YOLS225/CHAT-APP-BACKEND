import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from '../../rest/storage/storage.controller';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [StorageController],
  providers: [StorageService, UsersService, PrismaService],
  exports: [StorageService],
})
export class StorageModule {}
