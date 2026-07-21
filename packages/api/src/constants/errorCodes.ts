import { ErrorType } from '../@types'

export const errorCodes = {
  notFound: {
    type: 'not-found' as ErrorType,
    code: 'not-found',
    message: 'Resource not found'
  },
  forbidden: {
    type: 'forbidden' as ErrorType,
    code: 'forbidden',
    message: 'You do not have permission to perform this action'
  },
  invalidOperation: {
    type: 'invalid-operation' as ErrorType,
    code: 'invalid-operation',
    message: 'The requested operation is invalid'
  },
  invalidArgument: {
    type: 'invalid-argument' as ErrorType,
    code: 'invalid-argument',
    message: 'One or more arguments are invalid'
  },
  internalServerError: {
    type: 'internal-server-error' as ErrorType,
    code: 'internal-server-error',
    message: 'An internal server error occurred'
  },

  weakPassword: {
    type: 'invalid-argument' as ErrorType,
    code: 'weak-password',
    message: 'The provided password is too weak'
  },
  alreadyExists: {
    type: 'invalid-operation' as ErrorType,
    code: 'already-exists',
    message: 'The resource already exists'
  },
  outsideThePeriod: {
    type: 'invalid-operation' as ErrorType,
    code: 'outside-the-period',
    message: 'The operation cannot be performed outside the allowed period'
  },
  stockExceeded: {
    type: 'invalid-operation' as ErrorType,
    code: 'stock-exceeded',
    message: 'The stock quantity has been exceeded'
  },
  invalidCredential: {
    type: 'invalid-argument' as ErrorType,
    code: 'invalid-credential',
    message: 'The provided credentials are invalid'
  },
  emailAlreadyInUse: {
    type: 'invalid-argument' as ErrorType,
    code: 'email-already-in-use',
    message: 'The email address is already in use by another account'
  },
  unionCircleNotFound: {
    type: 'not-found' as ErrorType,
    code: 'union-circle-not-found',
    message: 'The specified union circle was not found'
  },
  unionCircleAlreadyExists: {
    type: 'invalid-operation' as ErrorType,
    code: 'union-circle-already-exists',
    message: 'A union circle with the specified circles already exists'
  },

  // このエラーコードは API キーが無効な場合に使用される (クライアント側で自動再ログイン等が行われる)
  // アクセス権限がない場合などでエラーを返したい場合は forbidden を使用すること
  unauthorized: {
    type: 'unauthorized' as ErrorType,
    code: 'unauthorized',
    message: 'Authentication is required to access this resource'
  }
}
