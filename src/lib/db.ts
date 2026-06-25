import { PrismaClient } from '@prisma/client'

// In development sandbox, system DATABASE_URL points to SQLite.
// Load .env with override to ensure Neon PostgreSQL URL is used.
// In production (Vercel), NODE_ENV=production so this is skipped.
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ override: true })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

// For backwards compatibility
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop)
  },
})