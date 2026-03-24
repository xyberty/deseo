import { randomBytes } from 'crypto';
import { getDb } from './mongodb';

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface Session {
  token: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Creates a new opaque session token in the DB and returns the token string.
 * The token is a 48-byte random hex string — no user-readable claims.
 */
export async function createSession(email: string): Promise<string> {
  const db = await getDb();
  const token = randomBytes(48).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await db.collection<Session>('sessions').insertOne({
    token,
    email,
    createdAt: now,
    expiresAt,
  });

  return token;
}

/**
 * Looks up a session by token. Returns null if not found or already expired.
 * MongoDB's TTL index will eventually purge expired documents, but the
 * expiresAt guard here makes expiry instant regardless of TTL sweep timing.
 */
export async function getSession(token: string): Promise<Session | null> {
  const db = await getDb();
  const session = await db.collection<Session>('sessions').findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  return session ?? null;
}

/**
 * Deletes a session from the DB on explicit sign-out.
 */
export async function revokeSession(token: string): Promise<void> {
  const db = await getDb();
  await db.collection<Session>('sessions').deleteOne({ token });
}
