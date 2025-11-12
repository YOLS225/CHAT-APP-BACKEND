import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from '../../business-logic/auth/auth.service';
import {
  AuthDto,
  RefreshTokenDto,
} from '../../business-logic/auth/dto/auth.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authentification of User',
    description: 'Login avec email/password. Retourne un access token et un refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  login(@Body() createAuthDto: AuthDto) {
    return this.authService.login(createAuthDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Génère un nouveau access token à partir du refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout/:id')
  @ApiOperation({ summary: 'Logout of User' })
  logout(@Param('id') id: string) {
    return this.authService.logout(id);
  }
}
