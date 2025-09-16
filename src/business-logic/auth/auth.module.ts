import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from '../../rest/auth/auth.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
// construction du payload JWT
