import { errorCodes } from '../constants/errorCodes'
import type { ErrorType } from '../@types'

type ErrorCode = typeof errorCodes[keyof typeof errorCodes]

class APIError extends Error {
  public type: ErrorType
  public code: string

  constructor(type: ErrorCode, message?: string) {
    const errorCode = type as ErrorCode
    super(message || errorCode.message)
    this.name = this.constructor.name
    this.type = errorCode.type as ErrorType
    this.code = errorCode.code
  }

  static invalidOperation(message?: string) {
    return new APIError(errorCodes.invalidOperation, message)
  }

  static invalidArgument(message?: string) {
    return new APIError(errorCodes.invalidArgument, message)
  }

  static notFound(message?: string) {
    return new APIError(errorCodes.notFound, message)
  }

  static forbidden(message?: string) {
    return new APIError(errorCodes.forbidden, message)
  }

  static internalServerError(message?: string) {
    return new APIError(errorCodes.internalServerError, message)
  }
}

export default APIError
