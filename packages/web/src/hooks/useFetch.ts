import { useCallback } from 'react'
import { type AxiosRequestConfig, AxiosError, create } from 'axios'
import { useSetAtom } from 'jotai'
import { userAtom } from '../atoms/credentials'
import { useAPIError } from './useAPIError'
import useToken from './useToken'
import type { LoginResult } from 'chronocast'

interface IUseFetch {
  getAsync: <T>(endpoint: string, o: { requiredAuthorize?: boolean, abort: AbortController }) => Promise<T>
  postAsync: <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }) => Promise<T>
  patchAsync: <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }) => Promise<T>
  deleteAsync: <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }) => Promise<T>
}

const useFetch = (): IUseFetch => {
  const { loginToken, apiToken, setLoginToken, setAPIToken } = useToken()
  const setUser = useSetAtom(userAtom)
  const { interpretError } = useAPIError()

  const axios = create({
    baseURL: import.meta.env.VITE_API_BASE_URL
  })

  let retryPromise: Promise<LoginResult> | null = null
  axios.interceptors.response.use(
    res => res,
    async err => {
      if (err.code === 'ERR_CANCELED' || err.code === 'ERR_NETWORK' || (!apiToken && err.response.status)) {
        throw err
      }
      else if (retryPromise && err.response.status === 401) {
        setAPIToken(null)
        setUser(null)
        setLoginToken(null)
        retryPromise = null
        throw err
      }
      else if (apiToken && err.response.status === 401) {
        if (!retryPromise) {
          const loginAsync = async (): Promise<LoginResult> => {
            const result = await axios.post<LoginResult>('/accounts/login', { loginToken })
            return result.data
          }
          retryPromise = loginAsync()
        }
        return retryPromise
          .then(result => {
            setAPIToken(result.apiToken)
            setUser(result.user)
            return axios({
              ...err.config,
              headers: {
                ...err.config?.headers,
                Authorization: `Bearer ${result.apiToken}`
              }
            } as AxiosRequestConfig)
          })
          .catch(err => { throw err })
          .finally(() => {
            retryPromise = null
          })
      }
      throw err
    })

  const handleError = (error: unknown): never => {
    if (error instanceof AxiosError) {
      if (error.code === AxiosError.ERR_CANCELED) {
        throw error
      }
      const interpretedError = interpretError(error)
      throw interpretedError
    }

    throw error
  }

  const getAsync = useCallback(async <T>(endpoint: string, o: { requiredAuthorize?: boolean, abort: AbortController }): Promise<T> => {
    if (o.requiredAuthorize && !apiToken) {
      throw new Error('Unauthorized')
    }

    const config: AxiosRequestConfig = {
      signal: o.abort.signal,
      headers: (apiToken && { Authorization: `Bearer ${apiToken}` }) || undefined
    }
    try {
      const response = await axios.get<T>(endpoint, config)
      return response.data
    }
    catch (error) {
      return handleError(error)
    }
  }, [apiToken])

  const postAsync = useCallback(async <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }): Promise<T> => {
    if (o.requiredAuthorize && !apiToken) {
      throw new Error('Unauthorized')
    }

    const config: AxiosRequestConfig = {
      signal: o.abort.signal,
      headers: (apiToken && { Authorization: `Bearer ${apiToken}` }) || undefined
    }
    try {
      const response = await axios.post<T>(endpoint, body, config)
      return response.data
    }
    catch (error) {
      return handleError(error)
    }
  }, [apiToken])

  const patchAsync = useCallback(async <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }): Promise<T> => {
    if (o.requiredAuthorize && !apiToken) {
      throw new Error('Unauthorized')
    }

    const config: AxiosRequestConfig = {
      signal: o.abort.signal,
      headers: (apiToken && { Authorization: `Bearer ${apiToken}` }) || undefined
    }
    try {
      const response = await axios.patch<T>(endpoint, body, config)
      return response.data
    }
    catch (error) {
      return handleError(error)
    }
  }, [apiToken])

  const deleteAsync = useCallback(async <T>(endpoint: string, body: object, o: { requiredAuthorize?: boolean, abort: AbortController }): Promise<T> => {
    if (o.requiredAuthorize && !apiToken) {
      throw new Error('Unauthorized')
    }

    const config: AxiosRequestConfig = {
      signal: o.abort.signal,
      headers: (apiToken && { Authorization: `Bearer ${apiToken}` }) || undefined,
      data: body
    }
    try {
      const response = await axios.delete<T>(endpoint, config)
      return response.data
    }
    catch (error) {
      return handleError(error)
    }
  }, [apiToken])

  return {
    getAsync,
    postAsync,
    patchAsync,
    deleteAsync
  }
}

export default useFetch
