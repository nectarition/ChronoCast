import { cors } from 'hono/cors'
import errorHandler from './middlewares/errorHandler'
import { pathNormalization } from './middlewares/pathNormalization'
import prisma from './middlewares/prisma'
import s3 from './middlewares/s3'
import accountsRouter from './routes/accountsRouter'
import type { APIContext, APIEnv } from './@types'
import { Hono } from 'hono'
import foldersRouter from './routes/foldersRouter'

const app = new Hono<APIEnv>()

app.onError(errorHandler)

const getAllowedOrigins = (c: APIContext): string[] => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS
  if (!allowedOrigins) {
    throw new Error('ALLOWED_ORIGINS not configured')
  }

  return allowedOrigins.split(',').map((origin: string) => origin.trim())
}

app.use('*', (c, next) => {
  const allowedOrigins = getAllowedOrigins(c)
  return cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-JSON-Response-Count'],
    maxAge: 600
  })(c, next)
})

app.use('*', prisma)
app.use('*', s3)
app.use('*', pathNormalization)

app.options('*', c => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return c.text('')
})

app.get('/', c => c.json({ message: 'Hello, World!' }))

app.route('/', accountsRouter)
app.route('/', foldersRouter)

export default app
