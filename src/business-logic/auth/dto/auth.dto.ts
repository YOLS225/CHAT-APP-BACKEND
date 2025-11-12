import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token obtenu lors du login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    userName: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
  };

  @ApiProperty({ description: 'Access token (courte durée)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (longue durée)' })
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'Nouveau access token' })
  accessToken: string;
}
