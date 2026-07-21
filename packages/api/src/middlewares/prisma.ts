import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from './../generated/prisma'
import type { Bindings, Variables } from '../@types'
import type { D1Database } from '@cloudflare/workers-types'
import type { Context, Next } from 'hono'

const createPrisma = (db: D1Database): PrismaClient => {
  const adapter = new PrismaD1(db)
  return new PrismaClient({ adapter })
}

const prisma = async (
  c: Context<{ Bindings: Bindings, Variables: Variables }>,
  next: Next
) => {
  if (!c.get('prisma')) {
    const prisma = createPrisma(c.env.DB)
    c.set('prisma', prisma)
  }
  await next()
}

export default prisma
