import { Next } from 'hono'
import { APIContext } from '../@types'
import jwtHelper from '../helpers/jwtHelper'
import APIError from '../libs/APIError'
import { errorCodes } from '../constants/errorCodes'

const requiredLogin = async (c: APIContext, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new APIError(errorCodes.unauthorized)
  }

  const user = await jwtHelper.verifyAPITokenAsync(c, token)
  if (user === null) {
    throw new APIError(errorCodes.unauthorized)
  }

  c.set('user', user)

  return await next()
}

export default requiredLogin
