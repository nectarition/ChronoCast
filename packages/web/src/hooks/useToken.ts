import { useCallback } from 'react'
import { useAtom } from 'jotai'
import { apiTokenAtom } from '../atoms/credentials'

interface UseToken {
  apiToken: string | null
  setAPIToken: (token: string | null) => void
}

const useToken = (): UseToken => {
  const [stateAPIToken, setStateAPIToken] = useAtom(apiTokenAtom)

  const setAPIToken = useCallback((token: string | null) => setStateAPIToken(token), [])

  return {
    apiToken: stateAPIToken,
    setAPIToken
  }
}

export default useToken
