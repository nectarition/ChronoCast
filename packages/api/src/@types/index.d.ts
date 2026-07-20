import { Context } from 'hono'
import type { PrismaClient } from '../generated/prisma'
import type { S3Client } from '@aws-sdk/client-s3'

type Variables = {
  prisma: PrismaClient
  user: LoggedInUser
  s3: S3Client
}

export type APIEnv = { Bindings: Env, Variables: Variables }
export type APIContext = Context<APIEnv>

export type ErrorType = 'not-found'
  | 'invalid-operation'
  | 'invalid-argument'
  | 'unauthorized'
  | 'forbidden'
  | 'out-of-term'

export type RequestError = {
  code: number
  message?: string
}

export type LoggedInUser = {
  id: string;
}
