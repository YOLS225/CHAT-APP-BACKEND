import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from '../../business-logic/auth/auth.service';
import { AuthDto } from '../../business-logic/auth/dto/auth.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authentification of User' })
  login(@Body() createAuthDto: AuthDto) {
    return this.authService.login(createAuthDto);
  }

  @Post('logout/:id')
  @ApiOperation({ summary: 'Logout of User' })
  logout(@Param('id') id: string) {
    return this.authService.logout(id);
  }
}
