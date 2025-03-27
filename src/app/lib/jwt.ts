import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('Please add your JWT secret to .env.local');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';

export interface JWTPayload {
  email: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
} 