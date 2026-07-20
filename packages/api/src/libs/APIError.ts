import type { ErrorType } from '../@types'

class APIError extends Error {
  public type: ErrorType
  public code: string

  constructor (type: ErrorType, code: string, message?: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.type = type
  }
}

export default APIError
