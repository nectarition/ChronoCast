import { useCallback, useMemo } from 'react'
import { useAtom } from 'jotai'
import { apiTokenAtom, loginTokenAtom, loginTokenKey } from '../atoms/credentials'

interface UseToken {
  isReady: boolean
  loginToken: string | null | undefined
  apiToken: string | null
  setLoginToken: (token: string | null) => void
  setAPIToken: (token: string | null) => void
}

const useToken = (): UseToken => {
  const [stateLoginToken, setStateLoginToken] = useAtom(loginTokenAtom)
  const [stateAPIToken, setStateAPIToken] = useAtom(apiTokenAtom)

  const isReady = useMemo(() => {
    const storageToken = localStorage.getItem(loginTokenKey)
    if (storageToken === 'undefined') {
      localStorage.removeItem(loginTokenKey)
      return false
    }

    return storageToken === null
      ? storageToken === stateLoginToken
      : storageToken !== 'undefined'
        ? JSON.parse(storageToken) === stateLoginToken
        : false
  }, [stateLoginToken])

  const loginToken = useMemo(() => isReady ? stateLoginToken : undefined, [isReady, stateLoginToken])

  const setLoginToken = useCallback((token: string | null) => setStateLoginToken(token), [])
  const setAPIToken = useCallback((token: string | null) => setStateAPIToken(token), [])

  return {
    isReady,
    loginToken,
    apiToken: stateAPIToken,
    setLoginToken,
    setAPIToken
  }
}

export default useToken
