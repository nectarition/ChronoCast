import { Context } from 'hono'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import errorHelper from '../helpers/errorHelper'
import APIError from '../libs/APIError'
import type { Bindings, Variables } from '../@types'

const errorHandler = async (
  err: Error,
  c: Context<{ Bindings: Bindings, Variables: Variables }>
) => {
  console.error(err)
  
  if (err.name === APIError.name) {
    const apiError = err as APIError
    const errorType = apiError.type
    const errorDetail = errorHelper.convertError(errorType)
    const errorResult = {
      code: errorDetail.errorCode,
      reason: apiError.code,
      message: err.message
    }
    return c.json(errorResult, errorDetail.statusCode as ContentfulStatusCode)
  }

  const otherErrorResult = {
    code: 500,
    reason: 'internal-server-error',
    message: err.name || 'InternalServerError'
  }
  return c.json(otherErrorResult, 500)
}

export default errorHandler
