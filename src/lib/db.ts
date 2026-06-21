import { PrismaClient } from '@prisma/client'

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
