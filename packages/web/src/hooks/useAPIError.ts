import { useCallback } from 'react'

export const API_ERROR_CODES = {
  notFound: 'not-found',
  forbidden: 'forbidden',
  internalServerError: 'internal-server-error',
  weakPassword: 'weak-password',
  alreadyExists: 'already-exists',
  invalidArgument: 'invalid-argument',
  unauthorized: 'unauthorized',
  outsideThePeriod: 'application-outside-the-period',
  stockExceeded: 'stock-exceeded',
  invalidCredential: 'invalid-credential',
  emailAlreadyInUse: 'email-already-in-use',
  unionCircleNotFound: 'union-circle-not-found',
  unionCircleAlreadyExists: 'union-circle-already-exists'
} as const

const ERROR_MESSAGE_MAP: Record<string, string> = {
  [API_ERROR_CODES.notFound]: '見つかりません。管理者に問い合わせてください',
  [API_ERROR_CODES.weakPassword]: 'パスワードが弱すぎます。8文字以上の強力なパスワードを使用してください。',
  [API_ERROR_CODES.alreadyExists]: '既に存在するリソースです。',
  [API_ERROR_CODES.invalidArgument]: '無効な引数が指定されました。入力内容を確認して、もう一度お試しください。',
  [API_ERROR_CODES.forbidden]: 'この操作を実行する権限がありません。管理者に問い合わせてください。',
  [API_ERROR_CODES.unauthorized]: '認証が必要です。もう一度ログインしてください。',
  [API_ERROR_CODES.outsideThePeriod]: '受付期間外のため申し込みできませんでした。',
  [API_ERROR_CODES.stockExceeded]: '定員に達したため申し込みできませんでした。',
  [API_ERROR_CODES.invalidCredential]: '認証情報が無効です。メールアドレスとパスワードを確認してください。',
  [API_ERROR_CODES.emailAlreadyInUse]: 'このメールアドレスは既に使用されています。',
  [API_ERROR_CODES.unionCircleNotFound]: '隣接配置先サークルの申し込み ID が間違っています。申し込み ID が正しいか確認してください。',
  [API_ERROR_CODES.unionCircleAlreadyExists]: '隣接希望サークルが他のサークルとの隣接を希望しているため、申し込みできませんでした。',
  [API_ERROR_CODES.internalServerError]: 'サーバーで予期しないエラーが発生しました。時間をおいてもう一度お試しください。'
}

export type APIError = Error & {
  code: string
}

export const useAPIError = () => {
  const interpretError = useCallback((error: unknown): APIError => {
    const defaultError: APIError = {
      name: 'APIError',
      message: '予期しないエラーが発生しました',
      code: 'unknown-error'
    }

    if (
      error
      && typeof error === 'object'
      && 'response' in error
      && error.response
      && typeof error.response === 'object'
      && 'data' in error.response
    ) {
      const data = error.response.data as unknown
      if (
        data
        && typeof data === 'object'
        && 'reason' in data
        && 'message' in data
      ) {
        const response = data as {
          reason?: string
          message?: string
        }

        const errorCode = response.reason || 'unknown-error'
        const errorMessage = ERROR_MESSAGE_MAP[errorCode] || '予期しないエラーが発生しました'

        return {
          name: 'APIError',
          message: errorMessage,
          code: errorCode
        }
      }
    }

    return defaultError
  }, [])

  const getUserMessage = (errorCode: string): string => {
    return ERROR_MESSAGE_MAP[errorCode] || 'エラーが発生しました'
  }

  const isErrorCode = (error: unknown, code: string): boolean => {
    if (
      error
      && typeof error === 'object'
      && 'response' in error
      && error.response
      && typeof error.response === 'object'
      && 'data' in error.response
    ) {
      const data = error.response.data as unknown
      if (
        data
        && typeof data === 'object'
        && 'reason' in data
      ) {
        return (data as { reason?: string }).reason === code
      }
    }
    return false
  }

  return {
    interpretError,
    getUserMessage,
    isErrorCode
  }
}
