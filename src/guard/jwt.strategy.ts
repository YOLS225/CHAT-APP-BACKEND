import * as jwt from 'jsonwebtoken';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signJwt(payload: object): string {
  return jwt.sign(payload, getRequiredEnv('JWT_SECRET'), {
    expiresIn: process.env.JWT_EXPIRES_IN || '25min',
  });
}

export function verifyJwt(token: string): jwt.JwtPayload | string | null {
  try {
    return jwt.verify(token, getRequiredEnv('JWT_SECRET'));
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function signRefreshJwt(payload: object): string {
  return jwt.sign(payload, getRequiredEnv('JWT_REFRESH_SECRET'), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

export function verifyRefreshJwt(
  token: string,
): jwt.JwtPayload | string | null {
  try {
    return jwt.verify(token, getRequiredEnv('JWT_REFRESH_SECRET'));
  } catch (error) {
    console.error(error);
    return null;
  }
}
