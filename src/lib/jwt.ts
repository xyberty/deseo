import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export interface JWTPayload {
  email: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return jwt.sign(payload, SECRET as jwt.Secret, { expiresIn: "15m" });
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, SECRET as jwt.Secret) as unknown as JWTPayload;
    if (!decoded.email) {
      throw new Error("Invalid token payload");
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}
