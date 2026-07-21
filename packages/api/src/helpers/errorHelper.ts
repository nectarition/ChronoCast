import { ErrorType } from '../@types'

const convertError = (errorType: ErrorType): { statusCode: number, errorCode: number } => {
  switch (errorType) {
    case 'not-found':
      return {
        statusCode: 404,
        errorCode: 1
      }

    case 'invalid-operation':
      return {
        statusCode: 400,
        errorCode: 2
      }

    case 'invalid-argument':
      return {
        statusCode: 400,
        errorCode: 3
      }

    case 'unauthorized':
      return {
        statusCode: 401,
        errorCode: 4
      }

    case 'forbidden':
      return {
        statusCode: 403,
        errorCode: 5
      }

    case 'out-of-term':
      return {
        statusCode: 406,
        errorCode: 6
      }

    default:
      return {
        statusCode: 500,
        errorCode: 0
      }
  }
}

export default {
  convertError
}
