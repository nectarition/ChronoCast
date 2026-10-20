import { useCallback } from 'react'
import { useSetAtom } from 'jotai'
import { userAtom } from '../atoms/credentials'
import useFetch from './useFetch'
import useToken from './useToken'
import type { AuthorizeURLResult, LoginResult } from 'chronocast'

interface UseNectaritionID {
  getAuthorizeURLAsync: (abort: AbortController) => Promise<string>
  processCallbackAsync: (code: string, state: string, abort: AbortController) => Promise<LoginResult>
}

const useNectaritionID = (): UseNectaritionID => {
  const { getAsync, postAsync } = useFetch()
  const { setAPIToken } = useToken()
  const setUser = useSetAtom(userAtom)

  const getAuthorizeURLAsync = useCallback(async (abort: AbortController) => {
    const result = await getAsync<AuthorizeURLResult>('/accounts/authorize-url', { abort })
    return result.url
  }, [getAsync])

  const processCallbackAsync = useCallback(async (code: string, state: string, abort: AbortController) => {
    const result = await postAsync<LoginResult>('/accounts/oidc-callback', { code, state }, { abort })
    setAPIToken(result.apiToken)
    setUser(result.user)
    return result
  }, [postAsync, setAPIToken, setUser])

  return {
    getAuthorizeURLAsync,
    processCallbackAsync
  }
}

export default useNectaritionID
