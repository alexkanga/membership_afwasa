import bcrypt from 'bcryptjs';
import { db } from './db';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
  role: string;
}

export function createSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

export async function loginUser(email: string, password: string): Promise<SessionPayload | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
}
