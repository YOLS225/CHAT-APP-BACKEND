import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AuthDto {
  @ApiProperty({ example: 'string' })
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'string' })
  password: string;
}
