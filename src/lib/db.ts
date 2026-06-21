import { PrismaClient } from '@prisma/client'

// Load .env file to ensure correct DATABASE_URL overrides system env
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env'), override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url || !url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      `DATABASE_URL is invalid or missing. Got: ${url ? url.substring(0, 20) + '...' : 'undefined'}`
    )
  }
  return url
}

// Lazy singleton - only create when first accessed
let _db: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (!_db) {
    _db = globalForPrisma.prisma ?? new PrismaClient({
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _db
    }
  }
  return _db
}

// For backwards compatibility
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop)
  },
})
