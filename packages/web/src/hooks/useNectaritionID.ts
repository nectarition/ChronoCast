import { useCallback } from 'react'
import useAccount from './useAccount'
import useFetch from './useFetch'
import useToken from './useToken'
import type { AuthenticateResult, AuthorizeURLResult, LoginResult } from 'chronocast'

interface UseNectaritionID {
  getAuthorizeURLAsync: (abort: AbortController) => Promise<string>
  processCallbackAsync: (code: string, state: string, abort: AbortController) => Promise<LoginResult>
}

const useNectaritionID = (): UseNectaritionID => {
  const { getAsync, postAsync } = useFetch()
  const { setLoginToken } = useToken()
  const { loginAsync } = useAccount()

  const getAuthorizeURLAsync = useCallback(async (abort: AbortController) => {
    const result = await getAsync<AuthorizeURLResult>('/accounts/authorize-url', { abort })
    return result.url
  }, [getAsync])

  const processCallbackAsync = useCallback(async (code: string, state: string, abort: AbortController) => {
    return await postAsync<AuthenticateResult>('/accounts/oidc-callback', { code, state }, { abort })
      .then(async (res) => {
        setLoginToken(res.loginToken)
        const loginResult = await loginAsync(res.loginToken, abort)
        return loginResult
      })
      .catch(err => { throw err })
  }, [postAsync, loginAsync])

  return {
    getAuthorizeURLAsync,
    processCallbackAsync
  }
}

export default useNectaritionID
