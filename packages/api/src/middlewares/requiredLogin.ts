import { Next } from 'hono'
import { APIContext } from '../@types'
import { errorCodes } from '../constants/errorCodes'
import jwtHelper from '../helpers/jwtHelper'
import APIError from '../libs/APIError'

const requiredLogin = async (c: APIContext, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new APIError(errorCodes.unauthorized)
  }

  const user = await jwtHelper.verifyAPITokenAsync(c, token)
  if (user === null) {
    throw new APIError(errorCodes.unauthorized)
  }

  const prisma = c.get('prisma')
  const userRecord = await prisma.user.findUnique({
    where: {
      id: user.id
    }
  })
  if (!userRecord) {
    throw APIError.internalServerError()
  }
  else if (!userRecord.isActive) {
    throw APIError.forbidden()
  }

  c.set('user', user)

  return await next()
}

export default requiredLogin
