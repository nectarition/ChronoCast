import { useCallback, useEffect } from 'react'
import { useAtom } from 'jotai'
import { userAtom } from '../atoms/credentials'
import useFetch from './useFetch'
import useToken from './useToken'
import type {
  LoggedInUser,
  LoginResult,
  AuthenticateResult
} from 'chronocast'

interface UseAccount {
  user: LoggedInUser | null | undefined
  loginAsync: (loginToken: string, abort: AbortController) => Promise<LoginResult>
  authenticateAsync: (email: string, password: string, abort: AbortController) => Promise<AuthenticateResult>
  loginDirectlyAsync: (abort: AbortController) => Promise<LoginResult>
  logoutAsync: () => Promise<void>
}

const useAccount = (): UseAccount => {
  const {
    loginToken,
    apiToken,
    setLoginToken,
    setAPIToken
  } = useToken()
  const { postAsync } = useFetch()
  const [user, setUser] = useAtom(userAtom)

  const loginAsync = useCallback(async (loginToken: string, abort: AbortController) => {
    const result = await postAsync<LoginResult>(
      '/accounts/login',
      { loginToken },
      { abort })
      .then(res => {
        return res
      })
      .catch(err => {
        if (err.code === 'ERR_CANCELED') {
          throw err
        }
        setAPIToken(null)
        setUser(null)
        throw err
      })

    setAPIToken(result.apiToken)
    setUser(result.user)

    return result
  }, [postAsync])

  const authenticateAsync = useCallback(async (email: string, password: string, abort: AbortController) => {
    const result = await postAsync<AuthenticateResult>('/accounts/authenticate', { email, password }, { abort })
    setLoginToken(result.loginToken)
    return result
  }, [postAsync])

  const loginDirectlyAsync = useCallback(async (abort: AbortController) => {
    if (loginToken === undefined) {
      throw new Error('Login token is undefined')
    }
    if (!loginToken) {
      setUser(null)
      throw new Error('No login token available')
    }

    const result = await loginAsync(loginToken, abort)
      .catch(err => { throw err })

    return result
  }, [loginToken, loginAsync])

  const logoutAsync = useCallback(async () => {
    setLoginToken(null)
    setAPIToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (loginToken === undefined) {
      setUser(undefined)
    }
    else if (loginToken === null && !apiToken) {
      setUser(null)
    }
  }, [loginToken, apiToken])

  return {
    user,
    loginAsync,
    authenticateAsync,
    loginDirectlyAsync,
    logoutAsync
  }
}

export default useAccount
