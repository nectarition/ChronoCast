import { useCallback } from 'react'
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
  loginAsync: (abort: AbortController) => Promise<LoginResult>
  authenticateAsync: (email: string, password: string, abort: AbortController) => Promise<AuthenticateResult>
  loginDirectlyAsync: (abort: AbortController) => Promise<LoginResult>
  logoutAsync: (abort: AbortController) => Promise<void>
}

const useAccount = (): UseAccount => {
  const { setAPIToken } = useToken()
  const { postAsync } = useFetch()
  const [user, setUser] = useAtom(userAtom)

  const loginAsync = useCallback(async (abort: AbortController) => {
    const result = await postAsync<LoginResult>('/accounts/login', {}, { abort })
      .then(res => { return res })
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
    return result
  }, [postAsync])

  const loginDirectlyAsync = useCallback(async (abort: AbortController) => {
    const result = await loginAsync(abort)
      .catch(err => { throw err })

    return result
  }, [loginAsync])

  const logoutAsync = useCallback(async (abort: AbortController) => {
    await postAsync('/accounts/logout', {}, { abort })
    setAPIToken(null)
    setUser(null)
  }, [postAsync])

  return {
    user,
    loginAsync,
    authenticateAsync,
    loginDirectlyAsync,
    logoutAsync
  }
}

export default useAccount
