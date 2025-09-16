import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService(); // seulement si tu n'injectes pas

export function signJwt(payload: object): string {
  return jwt.sign(payload, configService.get('JWT_SECRET') || 'defaultSecret', {
    expiresIn: configService.get('JWT_EXPIRES_IN') || 3600000,
  });
}

export function verifyJwt(token: string): any {
  try {
    return jwt.verify(
      token,
      configService.get('JWT_SECRET') || 'defaultSecret',
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}
