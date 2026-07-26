import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../business-logic/auth/auth.service';
import {
  AuthDto,
  AcceptInvitationDto,
  RefreshTokenDto,
} from '../../business-logic/auth/dto/auth.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guard/jwt.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Authentification of User',
    description:
      'Login avec email/password. Retourne un access token et un refresh token.',
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

  @Post('accept-invitation')
  @ApiOperation({
    summary: 'Accept invitation',
    description:
      'Définit le mot de passe utilisateur depuis un token invitation.',
  })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto.token, dto.password);
  }

  @Post('logout/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout of User' })
  logout(@Param('id') id: string, @Req() request: Request) {
    const authenticatedUserId = (request.user as { sub?: string })?.sub;
    if (authenticatedUserId !== id) {
      throw new ForbiddenException('You can only logout your own account');
    }
    return this.authService.logout(id);
  }
}
