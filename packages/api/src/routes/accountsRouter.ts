import crypto from 'crypto'
import { Hono } from 'hono'
import jwtHelper from '../helpers/jwtHelper'
import APIError from '../libs/APIError'
import type { APIEnv } from '../@types'
import { AuthenticateResult, LoginResult } from 'chronocast'

const accountsRouter = new Hono<APIEnv>()

accountsRouter.post('/accounts/login', async (c) => {
  const { loginToken } = await c.req.json()
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
      isActive: user.isActive
    }
  }

  return c.json(result)
})

accountsRouter.get('/accounts/authorize-url', async (c) => {
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

accountsRouter.post('/accounts/oidc-callback', async (c) => {
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

  const prisma = c.get('prisma')
  let user = await prisma.user.findFirst({
    where: { oidcSub }
  })
  if (!user) {
    user = await prisma.user.create({
      data: { oidcSub }
    })
  }

  const loginToken = await jwtHelper.signLoginTokenAsync(c, { id: user.id })

  const result: AuthenticateResult = {
    loginToken
  }

  return c.json(result)
})

export default accountsRouter
