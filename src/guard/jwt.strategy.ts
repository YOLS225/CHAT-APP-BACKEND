import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService(); // seulement si tu n'injectes pas

export function signJwt(payload: object): string {
  return jwt.sign(payload, configService.get('JWT_SECRET') || 'defaultSecret', {
    expiresIn: configService.get('JWT_EXPIRES_IN') || '25min',
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

export function signRefreshJwt(payload: object): string {
  return jwt.sign(
    payload,
    configService.get('JWT_REFRESH_SECRET') || 'defsecret',
    {
      expiresIn: configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    },
  );
}

export function verifyRefreshJwt(token: string): any {
  try {
    return jwt.verify(
      token,
      configService.get('JWT_REFRESH_SECRET') || 'defsecret',
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}
