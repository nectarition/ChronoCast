import crypto from 'crypto'
import { LoginResult } from 'chronocast'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { errorCodes } from '../constants/errorCodes'
import jwtHelper from '../helpers/jwtHelper'
import APIError from '../libs/APIError'
import type { APIContext, APIEnv } from '../@types'

const accountsRouter = new Hono<APIEnv>()

const LOGIN_TOKEN_COOKIE_NAME = 'nct_chronocast_login_token'
const LOGIN_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 3 // 3 days

const loginTokenCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'None' as const,
  path: '/accounts',
  maxAge: LOGIN_TOKEN_COOKIE_MAX_AGE
}

const setLoginTokenCookie = (c: APIContext, loginToken: string) => {
  setCookie(c, LOGIN_TOKEN_COOKIE_NAME, loginToken, loginTokenCookieOptions)
}

const clearLoginTokenCookie = (c: APIContext) => {
  deleteCookie(c, LOGIN_TOKEN_COOKIE_NAME, loginTokenCookieOptions)
}

accountsRouter.post('/accounts/login', async c => {
  const loginToken = getCookie(c, LOGIN_TOKEN_COOKIE_NAME)
  if (!loginToken) {
    clearLoginTokenCookie(c)
    throw new APIError(errorCodes.unauthorized, 'Login token is required')
  }

  const prisma = c.get('prisma')
  const payload = await jwtHelper.verifyLoginTokenAsync(c, loginToken)
  if (!payload) {
    throw APIError.invalidArgument('Invalid token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id }
  })
  if (!user) {
    throw APIError.notFound('User not found')
  }

  const apiToken = await jwtHelper.signAPITokenAsync(c, { id: user.id })

  const result: LoginResult = {
    apiToken: apiToken,
    user: {
      email: user.email,
      isActive: user.isActive
    }
  }

  return c.json(result)
})

accountsRouter.post('/accounts/logout', async c => {
  clearLoginTokenCookie(c)
  return c.json({ success: true })
})

accountsRouter.get('/accounts/authorize-url', async c => {
  const clientId = c.env.OIDC_CLIENT_ID
  const redirectUri = c.env.OIDC_CALLBACK_URI

  const requestId = crypto.randomUUID()
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const nonce = crypto.randomBytes(32).toString('base64url')

  const state = await jwtHelper.signStateTokenAsync(c, requestId, codeVerifier)
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  const url = 'https://idapi.nectarition.jp/oidc/authorize'
    + '?response_type=code'
    + `&client_id=${encodeURIComponent(clientId)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + '&scope=openid%20profile%20email'
    + `&state=${encodeURIComponent(state)}`
    + `&nonce=${encodeURIComponent(nonce)}`
    + '&code_challenge_method=S256'
    + `&code_challenge=${encodeURIComponent(codeChallenge)}`
  return c.json({ url })
})

accountsRouter.post('/accounts/oidc-callback', async c => {
  const { code, state } = await c.req.json()

  const statePayload = await jwtHelper.verifyStateTokenAsync(c, state)
  if (!statePayload) {
    throw APIError.invalidArgument('Invalid state token')
  }

  const { codeVerifier } = statePayload

  const clientId = c.env.OIDC_CLIENT_ID
  const clientSecret = c.env.OIDC_CLIENT_SECRET
  const redirectUri = c.env.OIDC_CALLBACK_URI

  const tokenResponse = await fetch('https://idapi.nectarition.jp/oidc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier
    })
  })

  if (!tokenResponse.ok) {
    throw APIError.internalServerError('Token request failed')
  }

  const tokenData = await tokenResponse.json() as {
    id_token: string
  }

  const idToken = tokenData.id_token

  const jwksUri = 'https://idapi.nectarition.jp/.well-known/jwks.json'
  const expectedIssuer = 'https://idapi.nectarition.jp'
  const payload = await jwtHelper.verifyIdTokenAsync(
    idToken,
    jwksUri,
    clientId,
    expectedIssuer
  )

  const oidcSub = payload.sub
  if (!oidcSub) {
    throw APIError.notFound('Sub not found in ID token')
  }
  const email = payload.email
  if (!email) {
    throw APIError.notFound('Email not found in ID token')
  }

  const prisma = c.get('prisma')
  let user = await prisma.user.findFirst({
    where: { oidcSub }
  })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        oidcSub
      }
    })
  }
  else if (user.email !== email) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email }
    })
  }

  const loginToken = await jwtHelper.signLoginTokenAsync(c, { id: user.id })
  setLoginTokenCookie(c, loginToken)

  return c.json({ success: true })
})

export default accountsRouter
