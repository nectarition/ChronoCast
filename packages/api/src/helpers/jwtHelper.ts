import { sign, verify } from 'hono/jwt'
import { EncryptJWT, jwtDecrypt, jwtVerify, createRemoteJWKSet } from 'jose'
import { APIContext, LoggedInUser } from '../@types'
import { errorCodes } from '../constants/errorCodes'
import APIError from '../libs/APIError'

const signLoginTokenAsync = async (c: APIContext, user: LoggedInUser) => {
  const secret = c.env.JWT_LOGIN_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }

  return await signCoreAsync(secret, user.id, 60 * 60 * 24 * 3)
}

const signAPITokenAsync = async (c: APIContext, user: LoggedInUser) => {
  const secret = c.env.JWT_API_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }

  return await signCoreAsync(secret, user.id, 60 * 60 * 24)
}

const signCoreAsync = async (secret: string, userId: number, expiredSeconds: number) => {
  const payload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + expiredSeconds
  }

  const token = await sign(payload, secret)
  return token
}

const verifyLoginTokenAsync = async (c: APIContext, token: string) => {
  const secret = c.env.JWT_LOGIN_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }
  return await verifyCoreAsync(token, secret)
}

const verifyAPITokenAsync = async (c: APIContext, token: string) => {
  const secret = c.env.JWT_API_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }
  return await verifyCoreAsync(token, secret)
}

const verifyCoreAsync = async (token: string, secret: string) => {
  try {
    const payload = await verify(token, secret, 'HS256')
    if (!payload || !payload.uid) {
      return null
    }

    const userId = payload.uid as number
    const user: LoggedInUser = {
      id: userId
    }

    return user
  }
  catch (err: unknown) {
    const error: Error = err as Error
    if (error.name === 'JwtTokenExpired') {
      throw new APIError(errorCodes.unauthorized, 'State token expired')
    }
    throw err
  }
}

const signStateTokenAsync = async (c: APIContext, requestId: string, codeVerifier: string) => {
  const secret = c.env.JWT_STATE_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }

  const payload = {
    requestId,
    codeVerifier,
    exp: Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes
  }

  const key = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32))
  const jwe = await new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setExpirationTime('10m')
    .encrypt(key)

  return jwe
}

const verifyStateTokenAsync = async (c: APIContext, token: string) => {
  const secret = c.env.JWT_STATE_TOKEN_SECRET
  if (!secret) {
    throw new Error('JWT secret not configured')
  }

  try {
    const key = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32))
    const decryptResult = await jwtDecrypt<{ requestId: string; codeVerifier: string }>(token, key)

    if (!decryptResult.payload.requestId || !decryptResult.payload.codeVerifier) {
      return null
    }
    return decryptResult.payload as { requestId: string; codeVerifier: string }
  }
  catch (err: unknown) {
    const error: Error = err as Error
    if (error.name === 'JwtTokenExpired') {
      throw new APIError(errorCodes.unauthorized, 'State token expired')
    }
    throw err
  }
}

const verifyIdTokenAsync = async (
  idToken: string,
  jwksUri: string,
  expectedAudience: string,
  expectedIssuer: string
) => {
  try {
    const JWKS = createRemoteJWKSet(new URL(jwksUri))

    const result = await jwtVerify(idToken, JWKS, {
      audience: expectedAudience,
      issuer: expectedIssuer
    })

    return result.payload as {
      sub: string
      email: string
      name?: string
      nonce: string
      [key: string]: unknown
    }
  }
  catch {
    throw APIError.invalidArgument('ID Token verification failed')
  }
}

export default {
  signLoginTokenAsync,
  signAPITokenAsync,
  verifyLoginTokenAsync,
  verifyAPITokenAsync,
  signStateTokenAsync,
  verifyStateTokenAsync,
  verifyIdTokenAsync
}
